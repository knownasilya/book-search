import { z } from 'zod';

export interface Page<R extends RouterMap> {
  path: string;
  route: keyof R;
  query: z.infer<R[keyof R]['query']> | QueryParams;
  params: RouteParams;
}

export type RouteParams = Record<string, string>;
export type QueryParams = Record<string, string>;

type RouteMeta<RouteName> = [
  RouteName,
  RegExp,
  (...args: string[]) => RouteParams,
  string,
  string[]
];
export type RouteResolvedData = { name: string; data: any; component?: any };
export type Route = {
  urlTemplate: string;
  element: any;
  loading: any;
  error: any;
  query: any;
};
export type RouterMap = Record<string, Route>;
type ParseUrlParams<url> = url extends `${infer path}(${infer optionalPath})`
  ? ParseUrlParams<path> & Partial<ParseUrlParams<optionalPath>>
  : url extends `${infer start}/${infer rest}`
  ? ParseUrlParams<start> & ParseUrlParams<rest>
  : url extends `:${infer param}`
  ? { [k in param]: string }
  : {};
type RouteStatus =
  | { type: 'loading' }
  | { type: 'error'; value: any }
  | { type: 'data'; value: any };

export class Router<T extends RouterMap> {
  routes: RouteMeta<keyof T>[] = [];
  prev: string = '';
  map: T;

  private _addRoute(value: RouteMeta<keyof T>) {
    this.routes.push(value);
  }

  constructor(routes: T) {
    this.map = routes;
    Object.keys(routes).map((name) => {
      let value = routes[name].urlTemplate;
      value = value.replace(/\/$/g, '') || '/';
      let names = (value.match(/\/:\w+/g) || []).map((i) => i.slice(2));
      let pattern = value
        .replace(/[\s!#$()+,.:<=?[\\\]^{|}]/g, '\\$&')
        .replace(/\/\\:\w+/g, '/([^/]+)');

      this._addRoute([
        name,
        RegExp('^' + pattern + '$', 'i'),
        (...matches: string[]) =>
          matches.reduce((params, match, index) => {
            params[names[index]] = match;
            return params;
          }, {} as RouteParams),
        value,
        names,
      ]);
    });
  }

  getQueryParams(str: string) {
    const searchParams = new URLSearchParams(str);
    const values: Record<string, string> = Object.fromEntries(
      searchParams.entries()
    );
    return values;
  }

  parse(_path: string): Page<T> | false {
    let rawPath = _path.replace(/\/$/, '') || '/';
    const [path, qParams = ''] = rawPath.split('?');
    const qp = this.getQueryParams(qParams);

    for (let [route, pattern, cb] of this.routes) {
      let match = path.match(pattern);
      if (match) {
        return { path, route, query: qp, params: cb(...match.slice(1)) };
      }
    }

    return false;
  }

  private _parse(_path: string): Page<T> | false {
    let rawPath = _path.replace(/\/$/, '') || '/';
    const [path, qParams = ''] = rawPath.split('?');
    const qp = this.getQueryParams(qParams);
    if (this.prev === rawPath) return false;
    this.prev = rawPath;

    for (let [route, pattern, cb] of this.routes) {
      let match = path.match(pattern);
      if (match) {
        return { path, route, query: qp, params: cb(...match.slice(1)) };
      }
    }

    return false;
  }

  _stackChangeHandlers: Array<
    (
      stack: RouteResolvedData[],
      page: Page<T>
      // state: { type: 'loading' | 'data' | 'error'; value: any },
    ) => void
  > = [];
  _handlers: Array<
    (page: Page<T>, data?: any, stack?: RouteResolvedData[]) => void
  > = [];
  _resolvers: Record<
    keyof T,
    (params: RouteParams, query: QueryParams) => Promise<any>
  > = {} as any;

  addResolver(
    routeName: keyof T,
    fn: (params: RouteParams, query: QueryParams) => Promise<any>
  ): Router<T> {
    this._resolvers[routeName] = fn;
    return this;
  }

  addHandler(
    fn: (page: Page<T>, data?: any, stack?: RouteResolvedData[]) => void
  ): Router<T> {
    this._handlers.push(fn);

    try {
      return this;
    } finally {
      if (this.activeRoute) {
        fn(this.activeRoute.page, this.activeRoute.data, this.stack);
      }
    }
  }

  onStackChange(
    fn: (stack: RouteResolvedData[], page: Page<T>) => void
  ): Router<T> {
    this._stackChangeHandlers.push(fn);

    try {
      return this;
    } finally {
      if (this.activeRoute) {
        fn(
          this.stack,
          this.activeRoute.page
          // { type: 'data', value: this.activeRoute.data },
        );
      }
    }
  }

  activeRoute: null | { page: Page<T>; data: any } = null;
  prevRoute: null | { page: Page<T>; data: any } = null;
  _resolvedData: Record<
    keyof T,
    { model: any; params: RouteParams; query?: QueryParams }
  > = {} as any;

  dataForRoute(routeName: keyof T) {
    if (!(routeName in this._resolvedData)) {
      return null;
    }
    return this._resolvedData[routeName].model;
  }

  private cacheDataForRoute(
    routeName: keyof T,
    params: RouteParams,
    query: QueryParams,
    data: any
  ) {
    this._resolvedData[routeName] = {
      model: data,
      params,
      query,
    };
  }

  async resolveRoute(route: keyof T, params: RouteParams, query: QueryParams) {
    let data: any = null;
    // Use cached data
    if (!this.shouldResolveRoute(route, params, query)) {
      return this.dataForRoute(route);
    }
    // Load data handlers for each route and cache
    if (route in this._resolvers) {
      data = await this._resolvers[route](params, query);
      this.cacheDataForRoute(route, params, query, data);
    }
    return data;
  }

  shouldResolveRoute(name: keyof T, params: RouteParams, query: QueryParams) {
    // TODO: add custom user cache function
    if (!(name in this._resolvedData)) {
      return true;
    }

    const value = this._resolvedData[name as string];
    const route = this.routes.find(([routeName]) => name === routeName);

    if (!route) {
      throw new Error(
        `Unknown route: ${String(
          name
        )}, for chained routes, ensure you have defined parents`
      );
    }

    const paramsChanged = route[4].some(
      (key) => value.params[key] !== params[key]
    );

    if (paramsChanged) {
      return true;
    }

    const queryChanged = value.query
      ? queryKey(value.query) !== queryKey(query)
      : !value.query && query;

    if (queryChanged) {
      return true;
    }

    return false;
  }

  stack: RouteResolvedData[] = [];

  unloadRouteData(routeName: string) {
    delete this._resolvedData[routeName];
  }

  async navigate(page: Page<T>) {
    let data: any = null;
    let parts = (page.route as string).split('.');
    let routeParts: string[] = [];
    let routeStack: RouteResolvedData[] = [];

    while (parts.length) {
      routeParts.push(parts.shift() as string);
      const routeToResolve = routeParts.join('.') as keyof T;

      try {
        this.stackChanged(
          { type: 'loading' },
          {
            route: routeToResolve,
            currentStack: routeStack,
            page,
          }
        );
        data = await this.resolveRoute(routeToResolve, page.params, page.query);
        routeStack = this.stackChanged(
          { type: 'data', value: data },
          {
            route: routeToResolve,
            currentStack: routeStack,
            page,
          }
        );
      } catch (e) {
        this.stackChanged(
          { type: 'error', value: e },
          {
            route: routeToResolve,
            currentStack: routeStack,
            page,
          }
        );
      }
    }

    this.prevRoute = this.activeRoute;
    this.activeRoute = { page: page, data };
    this.stack = routeStack;
    this._handlers.forEach((fn) => fn(page, data, routeStack));
  }

  stackChanged(
    status: RouteStatus,
    {
      route,
      currentStack,
      page,
    }: {
      route: keyof T;
      currentStack: RouteResolvedData[];
      page: Page<T>;
    }
  ): RouteResolvedData[] {
    let mapped = this.map[route];

    switch (status.type) {
      case 'loading': {
        let stack = [
          ...currentStack,
          { name: route as string, component: mapped.loading, data: null },
        ];
        this._stackChangeHandlers.forEach((fn) => fn(stack, page));

        return stack;
      }
      case 'error': {
        let stack = [
          ...currentStack,
          {
            name: route as string,
            component: mapped.error,
            data: status.value,
          },
        ];
        this._stackChangeHandlers.forEach((fn) => fn(stack, page));

        return stack;
      }
      case 'data': {
        let stack = [
          ...currentStack,
          {
            name: route as string,
            component: mapped.element,
            data: status.value,
          },
        ];
        this._stackChangeHandlers.forEach((fn) => fn(stack, page));

        return stack;
      }
    }
  }

  async open(path: string, redirect?: boolean) {
    let page = this.parse(path);

    if (page !== false) {
      if (window.history) {
        if (redirect) {
          history.replaceState(null, '', path);
        } else {
          history.pushState(null, '', path);
        }
      }
      await this.navigate(page);
    }
  }

  async popstate() {
    let page = this._parse(location.pathname + location.search);
    if (page !== false) {
      await this.navigate(page);
    }
  }

  onClick(rawEvent: MouseEvent) {
    const event = rawEvent as unknown as MouseEvent & {
      target: Element;
      button: number;
      metaKey: boolean;
      ctrlKey: boolean;
      shiftKey: boolean;
      altKey: boolean;
    };
    let link = event.target.closest('a');
    if (
      !event.defaultPrevented &&
      link &&
      event.button === 0 &&
      link.target !== '_blank' &&
      link.dataset.noRouter == null &&
      link.rel !== 'external' &&
      !link.download &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      let url = new URL(link.href);
      if (url.origin === location.origin) {
        event.preventDefault();
        let changed = location.hash !== url.hash;
        this.open(url.pathname + url.search);
        if (changed) {
          location.hash = url.hash;
          if (url.hash === '' || url.hash === '#') {
            window.dispatchEvent(new HashChangeEvent('hashchange'));
          }
        }
      }
    }
  }

  _domHandlers: [HTMLElement | Window, string, (e: any) => any][] = [];

  async mount(
    path = typeof location !== undefined
      ? location.pathname + location.search
      : '/',
    ssr = false
  ) {
    if (!ssr) {
      if (typeof window === 'undefined') {
        throw new Error('Unable to mount in SSR mode');
      }
      const onClick = (e: MouseEvent) => {
        return this.onClick(e);
      };
      const popState = () => {
        return this.popstate();
      };
      document.body.addEventListener('click', onClick);
      this._domHandlers.push([document.body, 'click', onClick]);
      window.addEventListener('popstate', popState);
      this._domHandlers.push([window, 'popstate', popState]);
    }

    let page = this._parse(path);

    if (page !== false) {
      await this.navigate(page);
    }
  }

  unmount() {
    this._domHandlers.forEach(([element, eventName, fn]) => {
      element.removeEventListener(eventName, fn);
    });
    this.activeRoute = null;
    this.prevRoute = null;
    this._resolvers = {} as any;
    this._handlers = [];
  }

  go<K extends keyof T>(
    name: K,
    params: ParseUrlParams<T[K]['urlTemplate']>,
    query?: z.infer<T[K]['query']>
  ) {
    this.open(getPagePath(this, name as string, params, query));
  }

  url<K extends keyof T>(
    name: K,
    params: ParseUrlParams<T[K]['urlTemplate']>,
    query?: z.infer<T[K]['query']>
  ) {
    return getPagePath(this, name as string, params, query);
  }
}

export function getPagePath(
  router: Router<any>,
  name: string,
  params: RouteParams,
  query: QueryParams = {}
) {
  let route = router.routes.find((i) => i[0] === name);
  if (!route) {
    throw new Error(`Unknown route: ${name}`);
  }
  const path = route[3].replace(/\/:\w+/g, (i) => '/' + params[i.slice(2)]);
  const url = new URL(document.location.origin + path);
  if (Object.keys(query)) {
    Object.keys(query).forEach((key) => {
      url.searchParams.set(key, encodeURIComponent(query[key]));
    });
  }
  // url.searchParams.set(key, encodeURIComponent(value));
  return url.pathname + url.search;
}

export function openPage(
  router: Router<any>,
  name: string,
  params: RouteParams,
  query?: QueryParams
) {
  router.open(getPagePath(router, name, params, query));
}

export function redirectPage(
  router: Router<any>,
  name: string,
  params: RouteParams,
  query?: QueryParams
) {
  router.open(getPagePath(router, name, params, query), true);
}

function queryKey(record: Record<string, string>) {
  return Object.keys(record)
    .map((key) => `${key}:${record[key]}`)
    .sort()
    .join('');
}

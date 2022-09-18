export interface Page {
  path: string;
  route: string;
  query: QueryParams;
  params: RouteParams;
}

export type RouteParams = Record<string, string>;
export type QueryParams = Record<string, string>;

type RouteMeta = [
  string,
  RegExp,
  (...args: string[]) => RouteParams,
  string,
  string[]
];
export type RouteResolvedData = { name: string; data: any };

export class Router<T extends Record<string, string>> {
  routes: RouteMeta[] = [];
  prev!: string;

  private _addRoute(value: RouteMeta) {
    this.routes.push(value);
  }

  constructor(routes: T) {
    this.prev = '';
    Object.keys(routes).map((name) => {
      let value = routes[name];
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
    const values: Record<string, string> = str.split('&').reduce((acc, el) => {
      const [key, val] = el.split('=');
      if (key.trim().length) {
        acc[key.trim()] = decodeURIComponent(decodeURIComponent(val || ''));
      }
      return acc;
    }, {} as Record<string, string>);
    return values;
  }

  parse(_path: string): Page | false {
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

  private _parse(_path: string): Page | false {
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

  _handlers: Array<
    (page: Page, data?: any, stack?: RouteResolvedData[]) => void
  > = [];
  _resolvers: Record<
    string,
    (params: RouteParams, query: QueryParams) => Promise<any>
  > = {};

  addResolver(
    routeName: keyof T,
    fn: (params: RouteParams, query: QueryParams) => Promise<any>
  ): Router<T> {
    this._resolvers[routeName as string] = fn;
    return this;
  }

  addHandler(
    fn: (page: Page, data?: any, stack?: RouteResolvedData[]) => void
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

  activeRoute: null | { page: Page; data: any } = null;
  prevRoute: null | { page: Page; data: any } = null;
  _resolvedData: Record<
    string,
    { model: any; params: RouteParams; query?: QueryParams }
  > = {};

  dataForRoute(routeName: string) {
    if (!(routeName in this._resolvedData)) {
      return null;
    }
    return this._resolvedData[routeName].model;
  }

  async resolveRoute(route: string, params: RouteParams, query: QueryParams) {
    let data: any = null;
    if (!this.shouldResolveRoute(route, params, query)) {
      return this.dataForRoute(route);
    }
    if (route in this._resolvers) {
      data = await this._resolvers[route](params, query);
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
        `Unknown route: ${
          name as string
        }, for chained routes, ensure you have defined parents`
      );
    }

    const paramsChanged = route[4].some(
      (key) => value.params[key] !== params[key]
    );

    if (paramsChanged) {
      return true;
    }

    const queryChanged =
      value.query &&
      Object.keys(value.query).some((key) => value.query?.[key] !== query[key]);

    if (queryChanged) {
      return true;
    }

    return false;
  }

  stack: RouteResolvedData[] = [];

  unloadRouteData(routeName: string) {
    delete this._resolvedData[routeName];
  }

  async navigate(page: Page) {
    let data: any = null;

    let parts = page.route.split('.');
    let routeParts = [];
    let routeStack: RouteResolvedData[] = [];

    while (parts.length) {
      routeParts.push(parts.shift());
      const routeToResolve = routeParts.join('.');
      data = await this.resolveRoute(routeToResolve, page.params, page.query);
      routeStack.push({ name: routeToResolve, data });
      this._resolvedData[routeToResolve] = {
        model: data,
        params: page.params,
        query: page.query,
      };
    }

    this.prevRoute = this.activeRoute;
    this.activeRoute = { page: page, data };
    this.stack = routeStack;
    this._handlers.forEach((fn) => fn(page, data, routeStack));
  }
  async open(path: string, redirect?: boolean) {
    let page = this.parse(path);

    if (page !== false) {
      if (typeof history !== 'undefined') {
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
    this._resolvers = {};
    this._handlers = [];
  }

  openPage(name: keyof T, params: RouteParams, query?: QueryParams) {
    this.open(getPagePath(this, name as string, params, query));
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

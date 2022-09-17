import Component, { hbs, tracked } from '@glimmerx/component';
// @ts-ignore
import { on } from '@glimmerx/modifier';
import {
  Router,
  RouteParams,
  QueryParams,
  RouteResolvedData,
} from './lib/router';
// @ts-ignore
import Form from './Form';
// @ts-ignore
import NestedRouter from './NestedRouter';
import map, { Path, routes } from './routes';

export const router = new Router(map);

router.addResolver('books', makeResolver('books'));
router.addResolver('books.view', makeResolver('books.view'));

router.mount();

export default class App extends Component {
  @tracked route = '';
  @tracked routeComponent?: Component;
  @tracked routeData?: unknown;
  @tracked query?: QueryParams;
  @tracked params?: RouteParams;
  @tracked stack?: RouteResolvedData[];

  static template = hbs`
    <h1>Book Search</h1>

    <Form @router={{router}} action="/books">
      <label>
        Search For Books
        <input name='search' placeholder='Tolstoy' value={{this.query.search}} required={{true}}>
      </label>

      <button>Submit</button>
    </Form>
    
    <hr/>
    <NestedRouter @router={{router}} @stack={{this.stack}} @params={{this.params}} />
    {{!-- <this.routeComponent @data={{this.routeData}} @query={{this.query}}/> --}}
  `;

  constructor(owner: object, args: Record<string, unknown>) {
    super(owner, args);
    console.log(routes);

    router.addHandler((page, pageData: any, stack) => {
      console.log('Updating component and data', page.path, { page, pageData });
      const { component, data } = pageData ?? {};

      this.route = page.path;
      this.routeComponent = component;
      this.routeData = data;
      this.query = page.query;
      this.params = page.params;
      this.stack = stack;
    });
  }
}

function makeResolver(path: Path) {
  return async function (page: RouteParams, queryParams: QueryParams) {
    const route = routes[path];
    const params = route.params.parse(page);
    const query = route.query.parse(queryParams);
    const response = await route.loader({ params, query } as any);
    let data = response;

    if (response instanceof Response) {
      data = await response.json();
    }

    const element =
      typeof route.element === 'string'
        ? (await import(/* @vite-ignore */ route.element)).default
        : route.element;

    return { data, component: element };
  };
}

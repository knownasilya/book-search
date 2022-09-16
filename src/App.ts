import Component, { hbs, tracked } from '@glimmerx/component';
// @ts-ignore
import { on } from '@glimmerx/modifier';
import { Router, RouteParams, QueryParams } from './lib/router';
// @ts-ignore
import Form from './Form';
import map, { routes } from './routes';

export const router = new Router(map);

router.addResolver(
  'book-search',
  async function (page: RouteParams, queryParams: QueryParams) {
    const route = routes['book-search'];
    const params = route.params.parse(page);
    const query = route.query.parse(queryParams);
    const response = await route.loader({ params, query });
    let data = response;

    if (response instanceof Response) {
      data = await response.json();
    }

    const element =
      typeof route.element === 'string'
        ? (await import(/* @vite-ignore */ route.element)).default
        : route.element;

    return { data, component: element };
  }
);

router.mount();

export default class App extends Component {
  @tracked route = '';
  @tracked routeComponent: Component | undefined;
  @tracked routeData: unknown | undefined;
  @tracked query: QueryParams | undefined;

  static template = hbs`
    <h1>Book Search</h1>

    <Form @router={{router}} @action="/books/search">
      <label>
        Search For Books
        <input name='search' placeholder='Tolstoy' value={{this.query.search}} required={{true}}>
      </label>

      <button>Submit</button>
    </Form>

    
    <hr/>
    
    <this.routeComponent @data={{this.routeData}} @query={{this.query}}/>
  `;

  constructor(owner: object, args: Record<string, unknown>) {
    super(owner, args);
    console.log(routes);

    router.addHandler((page, pageData: any, stack) => {
      console.log('Updating component and data', page.path, { page, pageData });
      this.route = page.path;
      const { component, data } = pageData ?? {};
      this.routeComponent = component;
      this.routeData = data;
      this.query = page.query;
    });
  }
}

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
import { Path, routes } from './routes';

export const router = new Router(routes);

router.addResolver('books', makeResolver('books'));
router.addResolver('books.view', makeResolver('books.view'));

export default class App extends Component {
  @tracked query?: QueryParams;
  @tracked params?: RouteParams;
  @tracked stack?: RouteResolvedData[];

  decode = (val: string) => val && decodeURIComponent(val);

  static template = hbs`
    <h1>Book Search</h1>

    <Form @router={{router}} action="/books">
      <label>
        Search For Books
        <input name='search' placeholder='Tolstoy' value={{this.decode this.query.search}} required={{true}}>
      </label>

      <button>Submit</button>
    </Form>
    
    <hr/>
    <NestedRouter @router={{router}} @stack={{this.stack}} @params={{this.params}} @query={{this.query}} />
  `;

  constructor(owner: object, args: Record<string, unknown>) {
    super(owner, args);

    router.onStackChange((stack, page) => {
      console.log('Updating component and data', page.path, { page, stack });

      this.query = page.query as QueryParams;
      this.params = page.params;
      this.stack = stack;
    });

    router.mount();
  }
}

// TODO: move to router, shouldn't have to call `addResolver` manually, should happen internally.
function makeResolver(path: Path) {
  return async function (page: RouteParams, queryParams: QueryParams) {
    const route = routes[path];
    const params = route.params?.parse(page) ?? page;
    const query = route.query?.parse(queryParams) ?? queryParams;
    let response = await route.data({ params, query } as any);
    let data: Record<string, unknown> | Record<string, unknown>[] | Response =
      response;

    if (response instanceof Response) {
      data = await response.json();
    }

    // const element =
    //   typeof route.element === 'string'
    //     ? (await import(/* @vite-ignore */ route.element)).default
    //     : route.element;

    return data;
  };
}

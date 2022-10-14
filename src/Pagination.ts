import Component, { hbs } from '@glimmerx/component';
import { RoutesMap } from './routes';
import { Router } from './lib/router';

interface Signature {
  Args: { router: Router<RoutesMap>; next?: string; previous?: string };
}

export default class Pagination extends Component<Signature> {
  url = (value: string) => {
    const url = new URL(value);
    const qps = Object.fromEntries(url.searchParams.entries());
    const query: Record<string, string> = {
      search: qps.search,
    };

    if (qps.page) {
      query.page = qps.page;
    }

    return this.args.router.url('books', {}, query);
  };

  static template = hbs`
		<div class='pagination'>
			{{#if @previous}}
				<a href={{this.url @previous}}>Previous</a>
			{{/if}}

			{{#if @next}}
				<a href={{this.url @next}}>Next</a>
			{{/if}}
		</div>
    `;
}

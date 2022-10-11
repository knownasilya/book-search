import Component, { hbs } from '@glimmerx/component';
import { on } from '@glimmerx/modifier';
import { fn } from '@glimmerx/helper';
import { RoutesMap } from './routes';
import { QueryParams, Router } from './lib/router';

import './books.css';

export interface BookResult {
  id: number;
  title: string;
  formats: Record<string, string>;
  authors: { name: string; birth_year: number; death_year: number }[];
  subjects: string[];
}

interface Signature {
  Args: {
    router: Router<RoutesMap>;
    data: {
      results: BookResult[];
    };
  };
}

class Pagination extends Component<{
  Args: { router: Router<RoutesMap>; next?: string; previous?: string };
}> {
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

export default class Books extends Component<Signature> {
  bool = (val: any) => !!val;
  joinBy = (
    array: (Record<string, unknown> | unknown)[],
    key: string
  ): unknown => {
    return array
      .map((item: any) => {
        if (!(key in item)) {
          return item;
        }

        return item?.[key];
      })
      .join(', ');
  };

  selectBook = (book: BookResult | undefined) => {
    if (book) {
      const search = (this.args.router.activeRoute?.page.query as any).search;
      const query = {
        search,
      } as QueryParams;

      this.args.router.go('books.view', { bookId: String(book.id) }, query);
    }
  };

  static template = hbs`
    {{#if @data.results}}
      <ul class="books">
        {{#each @data.results as |book|}}
          <li>
            <button type='button' {{on 'click' (fn this.selectBook book)}}>
              {{book.title}}

              {{#if book.authors.length}}
                by <em>{{this.joinBy book.authors 'name'}}</em>
              {{/if}}
            </button>
          </li>
        {{/each}}
      </ul>

      <Pagination @router={{@router}} @next={{@data.next}} @previous={{@data.previous}} />
    {{else}}
      <p>No books found.</p>
    {{/if}}

    {{yield}}
  `;
}

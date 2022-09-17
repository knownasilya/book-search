import Component, { hbs, tracked } from '@glimmerx/component';
import { on } from '@glimmerx/modifier';
import { fn } from '@glimmerx/helper';
import { RoutesMap } from './routes';
import { Router } from './lib/router';

import './books.css';

interface Book {
  id: number;
  title: string;
  formats: Record<string, string>;
  authors: { name: string }[];
}

interface Signature {
  Args: {
    router: Router<RoutesMap>;
    data: {
      results: Book[];
    };
  };
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

  selectBook = (book: Book | undefined) => {
    debugger;
    if (book) {
      const search = this.args.router.activeRoute?.page.query.search;
      debugger;
      this.args.router.openPage('books.view', { bookId: String(book?.id) }, {
        search,
      } as any);
    }
  };

  static template = hbs`
    {{log @data}}

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
      {{else}}
        <li>No books found.</li>
      {{/each}}
    </ul>

    {{!-- {{yield}} --}}
  `;
}

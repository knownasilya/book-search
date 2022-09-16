import Component, { hbs } from '@glimmerx/component';

import './books.css';

export default class Books extends Component {
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

  static template = hbs`
    {{log @data}}

    <ul class="books">
      {{#each @data.results as |book|}}
        <li>
          {{book.title}}
          
          {{#if book.authors.length}}
            by <em>{{this.joinBy book.authors 'name'}}</em>
          {{/if}}
        </li>
      {{else}}
        <li>No books found.</li>
      {{/each}}
    </ul>
  `;
}

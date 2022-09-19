import Component, { hbs, tracked } from '@glimmerx/component';
import Form from './Form';
import { BookResult } from './Books';

import './BookModal.css';

interface Signature {
  Args: {
    data: {
      results: BookResult[];
    };
  };
}

export default class BookModal extends Component<Signature> {
  get book() {
    return this.args.data.results[0];
  }
  get bookImage() {
    return this.book.formats['image/jpeg'];
  }
  static template = hbs`
    {{log 'modal' @data}}
    <div class='modal'>
        <Form @router={{@router}} action='/books' class='backdrop'>
            <input type='hidden' name='search' value={{@query.search}} />

            <button />
        </Form>
        <dialog open>
            <Form @router={{@router}} action='/books'>
                <h2 class='header'>{{this.book.title}}</h2>
                
                <img class='left' src={{this.bookImage}} alt='book cover' />
                

                <div class='right'>
                    
                    <fieldset>
                        <legend>Author</legend>
                        
                        <ul>
                            {{#each this.book.authors as |author|}}
                                <li>
                                    {{author.name}} <br>
                                    {{author.birth_year}} - {{author.death_year}}
                                </li>
                            {{else}}
                                <li>Author not mentioned</li>
                            {{/each}}
                        </ul>
                    </fieldset>

                    <fieldset>
                        <legend>Subjects</legend>
                        <ul>
                            {{#each this.book.subjects as |subject|}}
                                <li>{{subject}}</li>
                            {{/each}}
                        </ul>
                    </fieldset>

                    <input type='hidden' name='search' value={{@query.search}} />

                </div>

                <div class='footer'>
                    <button>
                        Close
                    </button>
                </div>
            </Form>
        </dialog>
    </div>
  `;
}

import Component, { hbs, tracked } from '@glimmerx/component';
import Form from './Form';

import './BookModal.css';

interface Signature {
  Args: {
    data: any;
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
                <h2>{{this.book.title}}</h2>
                <img src={{this.bookImage}} alt='book cover' />

                <input type='hidden' name='search' value={{@query.search}} />

                <button>
                    close
                </button>
            </Form>
        </dialog>
    </div>
  `;
}

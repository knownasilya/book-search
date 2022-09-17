import Component, { hbs, tracked } from '@glimmerx/component';
import Form from './Form';

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
    {{log @data}}
    <dialog open='true'>
        <Form @router={{@router}} action='/books'>
            <h2>{{this.book.title}}</h2>
            <img src={{this.bookImage}} alt='book cover' />

            <button>
                close
            </button>
        </Form>
    </dialog>
  `;
}

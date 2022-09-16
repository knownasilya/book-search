import Component, { hbs } from '@glimmerx/component';
import { Router } from './lib/router';

// @ts-ignore
import { on } from '@glimmerx/modifier';

interface Signature {
  Args: {
    router: Router<any>;
    action: string;
  };
}

export default class Form extends Component<Signature> {
  static template = hbs`
    <form {{on 'submit' this.submit}} action={{@action}}>
        {{yield}}
    </form>
  `;

  submit = (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries((formData as any).entries());
    const relativeAction = form.action.replace(document.location.origin, '');
    const page = this.args.router.parse(relativeAction);

    if (page && form.method === 'get') {
      this.args.router.openPage(page.route, page.params, data);
    } else {
      throw new Error(
        `Form action '${relativeAction}' does not exist as a route`
      );
    }
  };
}

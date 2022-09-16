import Component, { hbs } from '@glimmerx/component';
import { QueryParams, Router } from './lib/router';
import { getFormSubmissionInfo } from './lib/dom';

// @ts-ignore
import { on } from '@glimmerx/modifier';

interface Signature {
  Element: HTMLFormElement;
  Args: {
    router: Router<any>;
  };
}

type SubmitTarget =
  | HTMLFormElement
  | HTMLButtonElement
  | HTMLInputElement
  | FormData
  | URLSearchParams
  | { [name: string]: string }
  | null;

export default class Form extends Component<Signature> {
  static template = hbs`
    <form {{on 'submit' this.submit}} ...attributes>
        {{yield}}
    </form>
  `;

  submit = (event: SubmitEvent) => {
    event.preventDefault();

    const defaultAction =
      this.args.router.activeRoute?.page.path ?? document.location.pathname;
    const form = event.currentTarget as SubmitTarget;
    const { method, formData, url } = getFormSubmissionInfo(
      form,
      defaultAction,
      {}
    );
    const data = Object.fromEntries(formData.entries());
    const page = this.args.router.parse(url.pathname);

    if (page && method === 'get') {
      this.args.router.openPage(page.route, page.params, data as QueryParams);
    } else {
      throw new Error(
        `Form action '${url.pathname}' does not exist as a route with method '${method}'`
      );
    }
  };
}

import Component, { hbs } from '@glimmerx/component';
import { RouteParams, Router } from './lib/router';
import { RoutesMap } from './routes';

interface Signature {
  Args: {
    router: Router<RoutesMap>;
    stack: { name: string; data: null | unknown }[];
    params?: RouteParams;
    components?: Record<string, Component>;
  };
}

const DefaultRoute = hbs`
  {{#if @hasChildren}} {{yield}} {{/if}}
`;

export default class NestedRouter extends Component<Signature> {
  get tail() {
    debugger;
    return this.parts.tail;
  }
  get parts() {
    const [head, ...tail] = this.args.stack;
    debugger;
    return {
      head,
      tail,
    };
  }
  get components() {
    return this.args.components ?? {};
  }
  get Component() {
    return this.model?.component || this.components[this.route] || DefaultRoute;
  }
  get route() {
    return this.parts.head.name;
  }
  get model() {
    return (this.parts.head.data || {}) as Record<string, unknown>;
  }
  static template = hbs`
      {{#if @stack.length}}
        <this.Component
          @route={{this.route}}
          @hasChildren={{this.tail.length}}
          @data={{this.model.data}}
          @params={{@params}}
          @router={{@router}}
        >
          {{#if this.tail.length}}
            <this @components={{this.components}} @stack={{this.tail}} @params={{@params}} @router={{@router}} />
          {{/if}}
        </this.Component>
      {{/if}}
    `;
}

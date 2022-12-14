import Component, { hbs } from '@glimmerx/component';
import { QueryParams, RouteParams, Router } from './lib/router';
import { RoutesMap } from './routes';

interface Signature {
  Args: {
    router: Router<RoutesMap>;
    stack: { name: string; data: null | unknown; component: any }[];
    params?: RouteParams;
    query?: QueryParams;
    components?: Record<string, Component>;
  };
}

const DefaultRoute = hbs`
  {{#if @hasChildren}} {{yield}} {{/if}}
`;

export default class NestedRouter extends Component<Signature> {
  get tail() {
    return this.parts.tail;
  }
  get parts() {
    const [head, ...tail] = this.args.stack;

    return {
      head,
      tail,
    };
  }
  get components() {
    return this.args.components ?? {};
  }
  get Self() {
    return NestedRouter;
  }
  get Component() {
    return (
      this.parts.head.component || this.components[this.route] || DefaultRoute
    );
  }
  get route() {
    return this.parts.head.name;
  }
  get data() {
    return (this.parts.head.data || {}) as Record<string, unknown>;
  }
  static template = hbs`
    {{log 'stack' @stack}}
      {{#if @stack.length}}
      {{log 'route' this.route this.tail}}
        <this.Component
          @route={{this.route}}
          @hasChildren={{this.tail.length}}
          @data={{this.data}}
          @params={{@params}}
          @query={{@query}}
          @router={{@router}}
        >
          <this.Self @components={{this.components}} @stack={{this.tail}} @params={{@params}} @query={{@query}} @router={{@router}} />
        </this.Component>
      {{/if}}
    `;
}

import Component, { hbs } from '@glimmerx/component';

export default class Route extends Component {
  static template = hbs`
    {{#if this.Component}}
			<this.Component @data={{this.data}} @params={{this.params}} />
		{{else}}
			no component
		{{/if}}
  `;
}

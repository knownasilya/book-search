import './style.css';

import { renderComponent } from '@glimmerx/core';
import App from './App';

document?.addEventListener(
  'DOMContentLoaded',
  () => {
    const element = document.getElementById('app');
    renderComponent(App, {
      element: element!,
      services: {},
    });
  },
  { once: true }
);

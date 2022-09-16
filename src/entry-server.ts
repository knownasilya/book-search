import { renderToString } from '@glimmerx/ssr';

// @ts-ignore
globalThis[Symbol.for('GLIMMER_VALIDATOR_REGISTRATION')] = false;
import App from './App';

export async function render(
  _url: string,
  _manifest: unknown,
  _rootDir: string
) {
  const ssrOutput = await renderToString(App, {
    rehydrate: true,
  });

  return ssrOutput;
}

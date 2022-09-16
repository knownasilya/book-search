import { defineConfig } from 'vite';
// @ts-ignore
import glimmerXPlugin from './plugin';

export default defineConfig({
  plugins: [glimmerXPlugin()],
});

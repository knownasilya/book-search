import { z } from 'zod';
import type Component from '@glimmerx/component';
import Books from './Books';

export const routes = {
  'book-search': createRoute('book-search', {
    element: Books as any,
    urlTemplate: '/books/search',
    params: z.object({}).optional(),
    query: z.object({
      search: z.string(),
    }),
    loader: async ({ query }) => {
      return fetch(`https://gutendex.com/books/?search=${query.search}`);
    },
  }),
} as const;

type Path = keyof typeof routes;
type Route = typeof routes[keyof typeof routes];

const map = Object.keys(routes).reduce<Record<Path, Route['urlTemplate']>>(
  (previous, current) => {
    previous[current as Path] = routes[current as Path].urlTemplate;
    return previous;
  },
  {} as Record<Path, Route['urlTemplate']>
);

export default map;

function createRoute<
  P extends string,
  C extends string | Component,
  T extends z.ZodType<any, any, any>,
  Q extends z.ZodType<any, any, any>,
  D,
  U extends string
>(
  path: P,
  {
    element,
    params,
    query,
    loader,
    urlTemplate,
  }: {
    element: C;
    params: T;
    query: Q;
    loader: (options: { params: z.infer<T>; query: z.infer<Q> }) => D;
    urlTemplate: U;
  }
) {
  return {
    path,
    element,
    urlTemplate,
    params,
    query,
    loader,
  } as const;
}

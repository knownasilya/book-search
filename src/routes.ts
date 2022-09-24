import { z } from 'zod';
import type Component from '@glimmerx/component';
import Books from './Books';
import BookModal from './BookModal';

export const routes = {
  books: route('/books', {
    element: Books as any,
    params: z.object({}).optional(),
    query: z.object({
      search: z.string(),
    }),
    loader: async ({ query }) => {
      return fetch(`https://gutendex.com/books/?search=${query.search}`);
    },
  }),
  'books.view': route('/books/:bookId', {
    element: BookModal as any,
    params: z.object({
      bookId: z.string(),
    }),
    query: z.object({
      search: z.string(),
    }),
    loader: async ({ params }) => {
      return fetch(`https://gutendex.com/books/?ids=${params.bookId}`);
    },
  }),
} as const;

export type RoutesMap = typeof routes;
export type Path = keyof RoutesMap;
export type Route = RoutesMap[keyof typeof routes];

export default routes;

function route<
  C extends string | Component,
  T extends z.ZodType<any, any, any>,
  Q extends z.ZodType<any, any, any>,
  D,
  U extends string
>(
  urlTemplate: U,
  {
    element,
    params,
    query,
    loader,
  }: {
    element: C;
    params: T;
    query: Q;
    loader: (options: { params: z.infer<T>; query: z.infer<Q> }) => D;
  }
) {
  return {
    element,
    urlTemplate,
    params,
    query,
    loader,
  } as const;
}

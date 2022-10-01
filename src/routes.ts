import { z } from 'zod';
import Component, { hbs } from '@glimmerx/component';
import Books from './Books';
import BookModal from './BookModal';

const Loading = hbs`Loading...`;
const Err = hbs`Error: {{@data.message}}`;

export const routes = {
  books: route('/books', {
    element: Books as any,
    loading: Loading as any,
    error: Err as any,
    params: z.object({}).optional(),
    query: z.object({
      search: z.string(),
      page: z.string().optional(),
    }),
    data: async ({ query }) => {
      const searchParams = new URLSearchParams({ ...query, languages: 'en' });
      return fetch(`https://gutendex.com/books/?${searchParams}`);
    },
  }),
  'books.view': route('/books/:bookId', {
    element: BookModal as any,
    loading: Loading as any,
    error: Err as any,
    params: z.object({
      bookId: z.string(),
    }),
    query: z.object({
      search: z.string(),
    }),
    data: async ({ params }) => {
      return fetch(`https://gutendex.com/books/${params.bookId}`);
    },
  }),
} as const;

export type RoutesMap = typeof routes;
export type Path = keyof RoutesMap;
export type Route = RoutesMap[keyof typeof routes];

export default routes;

function route<
  C extends string | Component<any>,
  L extends string | Component<any>,
  E extends string | Component<any>,
  T extends z.ZodType<any, any, any>,
  Q extends z.ZodType<any, any, any>,
  D,
  U extends string
>(
  urlTemplate: U,
  {
    element,
    loading,
    error,
    params,
    query,
    data,
  }: {
    element: C;
    loading?: L;
    error?: E;
    params?: T;
    query?: Q;
    data: (options: { params: z.infer<T>; query: z.infer<Q> }) => D;
  }
) {
  return {
    element,
    loading,
    error,
    urlTemplate,
    params,
    query,
    data,
  } as const;
}

/** @description Make object types more readable. */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & unknown;

export type Maybe<T> = T | null | undefined;

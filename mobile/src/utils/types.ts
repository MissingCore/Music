/** Get the type of the value returned from a promise. */
export type ExtractFnReturnType<FnType extends (...args: any) => any> = Awaited<
  ReturnType<FnType>
>;

/** Make object types more readable. */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & unknown;

export type Maybe<T> = T | null | undefined;

/** Make all keys in an object type have the same type. */
export type UniformObject<TObj extends Record<any, any>, TData> = {
  [K in keyof TObj]: TData;
};

/** Get all permutations from a list of elements. */
export type Permutations<T, K = T> = [T] extends [never]
  ? []
  : K extends K
    ? [K, ...Permutations<Exclude<T, K>>]
    : never;

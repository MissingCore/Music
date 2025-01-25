/** Get a partial of an object with some required fields. */
export type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/** Get the type of the value returned from a promise. */
export type ExtractFnReturnType<FnType extends (...args: any) => any> = Awaited<
  ReturnType<FnType>
>;

export type Maybe<T> = T | null | undefined;

/** Make object types more readable. */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & unknown;

/** Make all keys in an object type have the same type. */
export type UniformObject<TObj extends Record<any, any>, TData> = {
  [K in keyof TObj]: TData;
};

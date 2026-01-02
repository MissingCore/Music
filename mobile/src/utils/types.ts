/** Get a partial of an object with some required fields. */
export type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/** Use the boolean in the 1st position if not `undefined`. */
export type BooleanPriority<
  T extends boolean | undefined,
  U extends boolean,
> = undefined extends T ? U : NonNullable<T>;

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

/** Get the values of an object. */
export type ObjectValues<T> = T[keyof T];

/** Get the keys of fields that are arrays. */
export type ArrayObjectKeys<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends any[] ? K : never;
}[keyof T];

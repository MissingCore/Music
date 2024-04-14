import type { DefaultOptions, UseMutationResult } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";

const queryConfig: DefaultOptions = {
  queries: {
    networkMode: "always",
  },
  mutations: {
    networkMode: "always",
  },
};

// Create TanStack Query client.
export const queryClient = new QueryClient({ defaultOptions: queryConfig });

/** @description Get the type of the value returned from a promise. */
export type ExtractFnReturnType<FnType extends (...args: any) => any> = Awaited<
  ReturnType<FnType>
>;

/*
  Getting `select` to work with TypeScript:
    - https://stackoverflow.com/a/75788655
*/

/** @description Prevent "double" submissions w/ `mutation.mutate()`. */
export function mutateGuard<TData, TError, TVariables, TContext>(
  mutation: UseMutationResult<TData, TError, TVariables, TContext>,
  ...args: Parameters<typeof mutation.mutate>
) {
  if (!mutation.isPending) mutation.mutate(...args);
}

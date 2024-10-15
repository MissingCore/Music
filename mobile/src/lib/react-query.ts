import type { DefaultOptions, UseMutationResult } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";

import { settingKeys } from "@/constants/QueryKeys";

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

/*
  Getting `select` to work with TypeScript:
    - https://stackoverflow.com/a/75788655
*/

/** Prevent "double" submissions w/ `mutation.mutate()`. */
export function mutateGuard<TData, TError, TVariables, TContext>(
  mutation: UseMutationResult<TData, TError, TVariables, TContext>,
  ...args: Parameters<typeof mutation.mutate>
) {
  if (!mutation.isPending) mutation.mutate(...args);
}

/**
 * Helper for invalidating all queries except the "Latest Release" query
 * as that shouldn't ever change in the given app session.
 */
export function clearAllQueries(client = queryClient) {
  /*
    `removeQueries` will remove the cache, so navigating to a page in the
    stack will display the loading state.

    `resetQueries` will remove the cache, but also refetch the data, so
    there will be no loading state when navigating to a page in the stack.
  */
  client.removeQueries({
    predicate: ({ queryKey }) => queryKey[0] !== settingKeys.release(),
  });
}

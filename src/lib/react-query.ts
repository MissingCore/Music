import type { DefaultOptions, UseMutationResult } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";

import { settingKeys } from "@/features/setting/api/_queryKeys";

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
  client.invalidateQueries({
    predicate: ({ queryKey }) => queryKey[0] !== settingKeys.release(),
  });
}

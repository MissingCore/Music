import type { DefaultOptions } from "@tanstack/react-query";
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

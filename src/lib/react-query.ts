import { QueryClient } from "@tanstack/react-query";

// Create TanStack Query client.
export const queryClient = new QueryClient();

/** @description Get the type of the value returned from a promise. */
export type ExtractFnReturnType<FnType extends (...args: any) => any> = Awaited<
  ReturnType<FnType>
>;

/*
  Getting `select` to work with TypeScript:
    - https://stackoverflow.com/a/75788655
*/

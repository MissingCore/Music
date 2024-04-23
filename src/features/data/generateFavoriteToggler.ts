import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type QueryKeys = {
  all: readonly [{ entity: string }];
  detail: (
    id: string,
  ) => readonly [{ entity: string; scope: string; id: string }];
};

type ToggleFn = (contentId: string, currState: boolean) => Promise<void>;

/** @description Currying function for toggling the `isFavorite` state. */
export function generateFavoriteToggler<
  TData extends { id: string; isFavorite: boolean },
>(keys: QueryKeys, toggleFn: ToggleFn, invalidateKeys?: QueryKey[]) {
  return (contentId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (currState: boolean) => toggleFn(contentId, currState),
      onSuccess: () => {
        // Update the specific entry.
        queryClient.setQueryData(
          keys.detail(contentId),
          (old: Partial<TData>) => ({ ...old, isFavorite: !old.isFavorite }),
        );

        try {
          // Update the entry in the cumulative list.
          queryClient.setQueryData(keys.all, (old: Partial<TData>[]) =>
            old.map((data) => {
              if (data.id !== contentId) return data;
              return { ...data, isFavorite: !data.isFavorite };
            }),
          );
        } catch {
          // Silently handle case where cache isn't defined.
        }

        // Invalidate any keys if provided.
        if (invalidateKeys && invalidateKeys.length > 0) {
          invalidateKeys.forEach((key) =>
            queryClient.invalidateQueries({ queryKey: key }),
          );
        }
      },
    });
  };
}

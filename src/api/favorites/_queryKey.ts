/** @description Query keys for "favorite" related queries. */
export const favoriteKeys = {
  all: [{ entity: "favorites" }] as const,
  lists: () => [{ ...favoriteKeys.all, variant: "lists" }] as const,
  tracks: () => [{ ...favoriteKeys.all, variant: "tracks" }] as const,
};

/** Query keys for "playlist" related queries. */
export const playlistKeys = {
  all: [{ entity: "playlists" }] as const,
  details: () => [{ ...playlistKeys.all[0], scope: "detail" }] as const,
  detail: (name: string) => [{ ...playlistKeys.details()[0], name }] as const,
};

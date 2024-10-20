/** Query keys for "album" related queries. */
export const albumKeys = {
  all: [{ entity: "albums" }] as const,
  details: () => [{ ...albumKeys.all[0], scope: "detail" }] as const,
  detail: (id: string) => [{ ...albumKeys.details()[0], id }] as const,
};

/** Query keys for "artist" related queries. */
export const artistKeys = {
  all: [{ entity: "artists" }] as const,
  details: () => [{ ...artistKeys.all[0], scope: "detail" }] as const,
  detail: (name: string) => [{ ...artistKeys.details()[0], name }] as const,
};

/** Query keys for "favorite" related queries. */
export const favoriteKeys = {
  all: [{ entity: "favorites" }] as const,
  lists: () => [{ ...favoriteKeys.all, variant: "lists" }] as const,
  tracks: () => [{ ...favoriteKeys.all, variant: "tracks" }] as const,
};

/** Query keys for "playlist" related queries. */
export const playlistKeys = {
  all: [{ entity: "playlists" }] as const,
  details: () => [{ ...playlistKeys.all[0], scope: "detail" }] as const,
  detail: (name: string) => [{ ...playlistKeys.details()[0], name }] as const,
};

/** Query keys for "setting" related queries. */
export const settingKeys = {
  all: [{ entity: "settings" }] as const,
  release: () => [{ ...settingKeys.all[0], variant: "release" }] as const,
  storage: () => [{ ...settingKeys.all[0], variant: "storage" }] as const,
  storageRelation: (relation: string) =>
    [{ ...settingKeys.storage()[0], relation }] as const,
};

/** Query keys for "track" related queries. */
export const trackKeys = {
  all: [{ entity: "tracks" }] as const,
  details: () => [{ ...trackKeys.all[0], scope: "detail" }] as const,
  detail: (id: string) => [{ ...trackKeys.details()[0], id }] as const,
  detailWithRelation: (id: string) =>
    [{ ...trackKeys.detail(id)[0], relation: "playlist" }] as const,
};

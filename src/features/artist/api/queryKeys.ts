/** @description Query keys for "artist" related queries. */
export const artistKeys = {
  all: [{ entity: "artists" }] as const,
  details: () => [{ ...artistKeys.all[0], scope: "detail" }] as const,
  detail: (id: string) => [{ ...artistKeys.details()[0], id }] as const,
};

/** Query keys for "artist" related queries. */
export const artistKeys = {
  all: [{ entity: "artists" }] as const,
  details: () => [{ ...artistKeys.all[0], scope: "detail" }] as const,
  detail: (name: string) => [{ ...artistKeys.details()[0], name }] as const,
};

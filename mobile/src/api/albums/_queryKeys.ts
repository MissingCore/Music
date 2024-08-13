/** Query keys for "album" related queries. */
export const albumKeys = {
  all: [{ entity: "albums" }] as const,
  details: () => [{ ...albumKeys.all[0], scope: "detail" }] as const,
  detail: (id: string) => [{ ...albumKeys.details()[0], id }] as const,
};

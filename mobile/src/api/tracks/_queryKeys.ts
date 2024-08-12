/** Query keys for "track" related queries. */
export const trackKeys = {
  all: [{ entity: "tracks" }] as const,
  details: () => [{ ...trackKeys.all[0], scope: "detail" }] as const,
  detail: (id: string) => [{ ...trackKeys.details()[0], id }] as const,
  detailWithRelation: (id: string) =>
    [{ ...trackKeys.detail(id)[0], relation: "playlist" }] as const,
};

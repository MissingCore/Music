/** Query keys for "fileNodes" related queries. */
export const fileNodeKeys = {
  all: [{ entity: "file-nodes" }] as const,
  details: () => [{ ...fileNodeKeys.all[0], scope: "detail" }] as const,
  detail: (path: string) => [{ ...fileNodeKeys.details()[0], path }] as const,
};

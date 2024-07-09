/** @description Query keys for "setting" related queries. */
export const settingKeys = {
  all: [{ entity: "settings" }] as const,
  release: () => [{ ...settingKeys.all[0], variant: "release" }] as const,
  storage: () => [{ ...settingKeys.all[0], variant: "storage" }] as const,
  storageRelation: (relation: string) =>
    [{ ...settingKeys.storage()[0], relation }] as const,
};

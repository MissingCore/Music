/** @description Query keys for "setting" related queries. */
export const settingKeys = {
  all: [{ entity: "settings" }] as const,
  release: () => [{ ...settingKeys.all, variant: "release" }] as const,
  storage: () => [{ ...settingKeys.all, variant: "storage" }] as const,
};

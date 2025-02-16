import type { resources } from "../src/modules/i18n/translations/resources";

declare module "i18next" {
  interface CustomTypeOptions {
    /*
      Note that interpolation keys inside the translation aren't
      type-safe (except the built-in `count`). This is due to the
      contents of the JSON file not being imported "as const".
    */
    resources: (typeof resources)["en"];
  }
}

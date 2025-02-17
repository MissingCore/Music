import type { resources } from "../src/modules/i18n/translations/resources";

declare module "i18next" {
  interface CustomTypeOptions {
    /*
      Note that interpolation keys can't be inferred from JSON file (yet).
        - See: https://www.i18next.com/overview/typescript#not-working-interpolation-values
    */
    resources: (typeof resources)["en"];
  }
}

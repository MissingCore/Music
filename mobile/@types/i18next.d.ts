import type en from "../src/modules/i18n/translations/_legacy/en.json";

declare module "i18next" {
  interface CustomTypeOptions {
    resources: {
      /*
        Note that interpolation keys inside the translation aren't
        type-safe (except the built-in `count`). This is due to the
        contents of the JSON file not being imported "as const".
      */
      translation: typeof en;
    };
  }
}

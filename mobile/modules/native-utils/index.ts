// Reexport the native module. On web, it will be resolved to NativeUtilsModule.web.ts
// and on native platforms to NativeUtilsModule.ts
export { default } from "./src/NativeUtilsModule";
export { default as NativeUtilsView } from "./src/NativeUtilsView";
export type * from "./src/NativeUtils.types";

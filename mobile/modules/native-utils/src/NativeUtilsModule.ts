import { NativeModule, requireNativeModule } from "expo";

declare class NativeUtilsModule extends NativeModule {
  PI: number;
  launchAppViaIntent(): void;
}

const nativeModule = requireNativeModule<NativeUtilsModule>("NativeUtils");

export const PI = nativeModule.PI;

export function launchAppViaIntent() {
  return nativeModule.launchAppViaIntent();
}

import { NativeModule, requireNativeModule } from "expo";

declare class NativeUtilsModule extends NativeModule {
  isSystemDarkMode: boolean;
  launchAppViaIntent(): void;
}

const nativeModule = requireNativeModule<NativeUtilsModule>("NativeUtils");

export const isSystemDarkMode = nativeModule.isSystemDarkMode;

export function launchAppViaIntent() {
  return nativeModule.launchAppViaIntent();
}

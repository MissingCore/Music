import { NativeModule, requireNativeModule } from "expo";

declare class NativeUtilsModule extends NativeModule {
  PI: number;
  hello(): string;
}

const nativeModule = requireNativeModule<NativeUtilsModule>("NativeUtils");

export const PI = nativeModule.PI;

export function hello() {
  return nativeModule.hello();
}

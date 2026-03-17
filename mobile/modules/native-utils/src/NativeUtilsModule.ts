import { NativeModule, requireNativeModule } from "expo";

declare class NativeUtilsModule extends NativeModule {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

const nativeModule = requireNativeModule<NativeUtilsModule>("NativeUtils");

export const PI = nativeModule.PI;

export function hello() {
  return nativeModule.hello();
}

export function setValueAsync(value: string) {
  return nativeModule.setValueAsync(value);
}

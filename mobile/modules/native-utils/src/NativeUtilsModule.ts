import { NativeModule, requireNativeModule } from "expo";

import type { NativeUtilsModuleEvents } from "./NativeUtils.types";

declare class NativeUtilsModule extends NativeModule<NativeUtilsModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<NativeUtilsModule>("NativeUtils");

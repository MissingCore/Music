import NativeUtils from "../NativeUtils";

import type { Material3ColorScheme } from "./Material3ColorScheme";

export async function generateMaterial3ColorScheme(
  imageUri: string,
): Promise<Material3ColorScheme | null> {
  return NativeUtils.generateMaterial3ColorScheme(imageUri);
}

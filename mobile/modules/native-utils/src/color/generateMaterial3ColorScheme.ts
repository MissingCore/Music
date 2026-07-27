import NativeUtils from "../NativeUtils";

import type { Material3ColorScheme } from "./Material3ColorScheme";

export async function generateMaterial3ColorScheme(
  imageUri: string,
): Promise<Material3ColorScheme> {
  return NativeUtils.generateMaterial3ColorScheme(imageUri);
}

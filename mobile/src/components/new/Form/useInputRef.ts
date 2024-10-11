import { useRef } from "react";
import type { TextInput } from "react-native";

/** Simple hook to get a ref for any of our styled text input elements. */
export function useInputRef() {
  const ref = useRef<TextInput>(null);
  return ref;
}

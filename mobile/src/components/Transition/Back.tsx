import { router } from "expo-router";
import { View } from "react-native";

/** Navigate back when rendered. */
export function Back() {
  return <View ref={goBack} />;
}

function goBack(node: any) {
  if (node !== null) router.back();
}

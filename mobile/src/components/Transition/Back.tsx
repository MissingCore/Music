import { View } from "react-native";

import { router } from "~/navigation/utils/router";

/** Navigate back when rendered. */
export function Back() {
  return <View ref={goBack} />;
}

function goBack() {
  router.back();
  return () => {};
}

import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { View } from "react-native";

/** Navigate back when rendered. */
export function Back() {
  const navigation = useNavigation();

  const goBack = useCallback(() => {
    navigation.goBack();
    return () => {};
  }, [navigation]);

  return <View ref={goBack} />;
}

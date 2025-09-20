import { useNavigation } from "@react-navigation/native";
import type { ParseKeys } from "i18next";
import { useEffect } from "react";

type SupportedScreenOptions = {
  headerLeft?: () => React.ReactNode;
  headerRight?: () => React.ReactNode;
  title?: ParseKeys;
};

export function ScreenOptions(options: SupportedScreenOptions) {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions(options);
  }, [navigation, options]);

  return null;
}

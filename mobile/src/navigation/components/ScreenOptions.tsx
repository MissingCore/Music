import type {} from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";

type SupportedScreenOptions = {
  headerRight?: () => React.ReactNode;
};

export function ScreenOptions(options: SupportedScreenOptions) {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions(options);
  }, [navigation, options]);

  return null;
}

import type {} from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";

type SupportedScreenOptions = {
  headerLeft?: () => React.ReactNode;
  headerRight?: () => React.ReactNode;
  headerTitle?: string;
};

export function ScreenOptions(options: SupportedScreenOptions) {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions(options);
  }, [navigation, options]);

  return null;
}

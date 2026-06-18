import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";

import { resetTrackMultiSelect } from "../core/actions";

export function TrackMultiSelectListeners() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("state", resetTrackMultiSelect);
    return () => unsubscribe();
  }, [navigation]);

  return null;
}

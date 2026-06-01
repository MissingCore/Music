import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ModifyLyricProvierBase } from "../components/ModifyProviderViewBase";
import { createLyricProvider } from "../core/actions";

export default function CreateLyricProvider() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  return (
    <ModifyLyricProvierBase
      onSubmit={(entry) => {
        createLyricProvider(entry);
        navigation.goBack();
      }}
    />
  );
}

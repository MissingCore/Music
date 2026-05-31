import { toast } from "@missingcore/ui/toast";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ModifyLyricProvierBase } from "../components/ModifyProviderViewBase";
import { createLyricProvider } from "../core/actions";

export default function CreateLyricProvider() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  return (
    <ModifyLyricProvierBase
      onSubmit={async (entry) => {
        try {
          createLyricProvider(entry);
          navigation.goBack();
        } catch {
          toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}

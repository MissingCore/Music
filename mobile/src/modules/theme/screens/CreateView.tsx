import { toast } from "@missingcore/toast";
import { useNavigation } from "@react-navigation/native";

import { ModifyThemeBase } from "../components/ModifyViewBase";
import { createCustomTheme, revalidateCustomThemes } from "../queries";

export default function CreateTheme() {
  const navigation = useNavigation();
  return (
    <ModifyThemeBase
      onSubmit={async ({ _id, _importGen, ...entry }) => {
        try {
          await createCustomTheme(entry);
          revalidateCustomThemes();
          navigation.goBack();
        } catch {
          toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}

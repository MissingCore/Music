import { toast } from "@missingcore/toast";
import { useNavigation } from "@react-navigation/native";

import { wait } from "~/utils/promise";
import { ModifyThemeBase } from "../components/ModifyViewBase";
import { readThemeFile } from "../core/data";
import { createCustomTheme, revalidateCustomThemes } from "../queries";

export default function CreateTheme() {
  const navigation = useNavigation();
  return (
    <ModifyThemeBase
      actionConfig={{
        label: "feat.backup.extra.import",
        action: async ({ setFields }) => {
          try {
            const { name, scheme, colors } = await readThemeFile();
            await wait(100);
            toast.t("feat.backup.extra.importSuccess");
            setFields({ name, scheme, ...colors, _importGen: Date.now() });
          } catch (err) {
            toast.error((err as Error).message);
          }
        },
      }}
      onSubmit={async ({ _importGen, ...entry }) => {
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

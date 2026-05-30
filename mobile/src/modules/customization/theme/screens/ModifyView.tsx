import { toast } from "@missingcore/ui/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { wait } from "~/utils/promise";
import type { ThemeEntry } from "../components/ModifyViewBase";
import { ModifyThemeBase } from "../components/ModifyViewBase";
import {
  deleteCustomTheme,
  updateCustomTheme,
  useCustomTheme,
} from "../core/data";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyTheme({
  route: {
    params: { id: themeId },
  },
}: Props) {
  const navigation = useNavigation();
  const { isPending, error, data } = useCustomTheme(themeId);
  const activeCustomThemeId = usePreferenceStore((s) => s.activeCustomThemeId);

  if (isPending || error || !data)
    return <PagePlaceholder isPending={isPending} />;

  const isActiveTheme = activeCustomThemeId === themeId;
  const { id: _, ...initData } = data;

  return (
    <ModifyThemeBase
      initialData={initData as Partial<ThemeEntry>}
      actionConfig={
        isActiveTheme
          ? undefined
          : {
              label: "form.delete",
              action: async () => {
                await wait(1);
                try {
                  await deleteCustomTheme(themeId);
                  navigation.goBack();
                } catch {
                  toast.tError("err.flow.generic.title");
                }
              },
              danger: true,
            }
      }
      onSubmit={async ({ _importGen, ...entry }) => {
        try {
          await updateCustomTheme(themeId, entry);
          if (isActiveTheme) PreferenceSetters.setTheme(themeId);
          navigation.goBack();
        } catch {
          toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}

import { toast } from "@missingcore/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { wait } from "~/utils/promise";
import { ModifyThemeBase } from "../components/ModifyViewBase";
import type { ThemeEntry } from "../helpers/zod";
import {
  deleteCustomTheme,
  revalidateCustomThemes,
  updateCustomTheme,
  useCustomTheme,
} from "../queries";

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
                  revalidateCustomThemes();
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
          revalidateCustomThemes();
          if (isActiveTheme) PreferenceSetters.setTheme(themeId);
          navigation.goBack();
        } catch {
          toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}

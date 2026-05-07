import { toast } from "@missingcore/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { ModifyThemeBase } from "../components/ModifyViewBase";
import type { ThemeEntry } from "../helpers/zod";
import {
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

  const { id, ...rest } = data;
  const initData = { _id: id, ...rest } as Partial<ThemeEntry>;

  return (
    <ModifyThemeBase
      mode="edit"
      initialData={initData}
      onSubmit={async ({ _id, _importGen, ...entry }) => {
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

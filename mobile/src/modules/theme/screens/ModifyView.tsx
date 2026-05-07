import { toast } from "@missingcore/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";

import { db } from "~/db";
import { customThemes } from "../schema";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { throwIfNoResults } from "~/lib/drizzle";
import type { ThemeEntry } from "../components/ModifyViewBase";
import { ModifyThemeBase } from "../components/ModifyViewBase";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyTheme({
  route: {
    params: { id: themeId },
  },
}: Props) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isPending, error, data } = useCustomTheme(themeId);
  const activeCustomThemeId = usePreferenceStore((s) => s.activeCustomThemeId);

  if (isPending || error || !data)
    return <PagePlaceholder isPending={isPending} />;

  const isActiveTheme = activeCustomThemeId === themeId;

  return (
    <ModifyThemeBase
      mode="edit"
      initialData={data as ThemeEntry}
      onSubmit={async ({ id: _, ...entry }) => {
        try {
          await db
            .update(customThemes)
            .set(entry)
            .where(eq(customThemes.id, themeId));

          queryClient.resetQueries({ queryKey: ["custom-themes"] });
          if (isActiveTheme) PreferenceSetters.setTheme(themeId);
          navigation.goBack();
        } catch {
          toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}

//#region Query
async function getCustomTheme(themeId: string) {
  return throwIfNoResults(
    db.query.customThemes.findFirst({
      where: (fields, { eq }) => eq(fields.id, themeId),
    }),
  );
}

export function useCustomTheme(themeId: string) {
  return useQuery({
    queryKey: ["custom-themes", themeId],
    queryFn: () => getCustomTheme(themeId),
  });
}
//#endregion

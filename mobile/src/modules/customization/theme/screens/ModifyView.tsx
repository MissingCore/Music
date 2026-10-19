// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { wait } from "~/utils/promise";
import { ToolbarScreenOffset } from "~/components/next/composed/toolbar";
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
    return (
      <PagePlaceholder
        isPending={isPending}
        wrapperClassName={ToolbarScreenOffset}
      />
    );

  const isActiveTheme = activeCustomThemeId === themeId;
  const { id: _, scheme, ...initData } = data;

  return (
    <ModifyThemeBase
      initialData={{ ...initData, isDark: scheme === "dark" }}
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
              actionConfig: {
                icon: "delete",
                intent: "error",
                _iconColor: "error",
              },
              danger: true,
            }
      }
      onSubmit={async ({ _importGen, isDark, ...entry }) => {
        try {
          await updateCustomTheme(themeId, {
            ...entry,
            scheme: isDark ? "dark" : "light",
          });
          if (isActiveTheme) PreferenceSetters.setTheme(themeId);
          navigation.goBack();
        } catch {
          toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}

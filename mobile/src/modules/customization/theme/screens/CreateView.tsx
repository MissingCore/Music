// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useNavigation } from "@react-navigation/native";

import { wait } from "~/utils/promise";
import { ModifyThemeBase } from "../components/ModifyViewBase";
import { pickTheme, saveCustomTheme } from "../core/data";

export default function CreateTheme() {
  const navigation = useNavigation();
  return (
    <ModifyThemeBase
      actionConfig={{
        label: "feat.backup.extra.import",
        onPress: async ({ setFields }) => {
          try {
            const { name, scheme, colors } = await pickTheme();
            await wait(100);
            toast.t("feat.backup.extra.importSuccess");
            setFields({
              name,
              isDark: scheme === "dark",
              ...colors,
              _importGen: Date.now(),
            });
          } catch (err) {
            toast.error((err as Error).message);
          }
        },
        config: {
          icon: "upload",
          intent: "secondary",
          _iconColor: "onSurface",
        },
      }}
      onSubmit={async ({ _importGen, isDark, ...entry }) => {
        try {
          await saveCustomTheme({
            ...entry,
            scheme: isDark ? "dark" : "light",
          });
          navigation.goBack();
        } catch {
          toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}

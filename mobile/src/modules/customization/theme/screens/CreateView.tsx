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
        action: async ({ setFields }) => {
          try {
            const { name, scheme, colors } = await pickTheme();
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
          await saveCustomTheme(entry);
          navigation.goBack();
        } catch {
          toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}

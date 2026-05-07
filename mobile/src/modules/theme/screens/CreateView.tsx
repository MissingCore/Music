import { toast } from "@missingcore/toast";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";

import { db } from "~/db";
import { customThemes } from "../schema";

import { ModifyThemeBase } from "../components/ModifyViewBase";

export default function CreateTheme() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  return (
    <ModifyThemeBase
      onSubmit={async ({ _id, _importGen, ...entry }) => {
        try {
          await db.insert(customThemes).values(entry);
          await queryClient.invalidateQueries({ queryKey: ["custom-themes"] });
          navigation.goBack();
        } catch {
          toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}

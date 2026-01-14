import { toast } from "@backpackapp-io/react-native-toast";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { db } from "~/db";
import { lyrics } from "~/db/schema";

import { queries as q } from "~/queries/keyStore";

import { ToastOptions } from "~/lib/toast";
import { ModifyLyricBase } from "./ModifyViewBase";

export default function CreateLyric() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  return (
    <ModifyLyricBase
      onSubmit={async (data) => {
        try {
          const entry = { name: data.name, lyrics: data.lyrics };
          await db.insert(lyrics).values(entry);

          queryClient.invalidateQueries({ queryKey: q.lyrics._def });
          // TODO: Navigate to "Current Lyric" screen.
          navigation.goBack();
        } catch {
          toast.error(t("err.flow.generic.title"), ToastOptions);
        }
      }}
    />
  );
}

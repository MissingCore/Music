import { toast } from "@backpackapp-io/react-native-toast";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { db } from "~/db";
import { lyrics } from "~/db/schema";

import { queries as q } from "~/queries/keyStore";

import { ToastOptions } from "~/lib/toast";
import { ModifyLyricBase } from "./components/ModifyViewBase";

export default function CreateLyric() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();

  return (
    <ModifyLyricBase
      onSubmit={async ({ id: _, ...entry }) => {
        try {
          const [newLyric] = await db.insert(lyrics).values(entry).returning();
          if (!newLyric) throw new Error("Lyric not returned after insertion.");

          queryClient.invalidateQueries({ queryKey: q.lyrics._def });
          navigation.replace("Lyric", { id: newLyric.id });
        } catch {
          toast.error(t("err.flow.generic.title"), ToastOptions);
        }
      }}
    />
  );
}

import { toast } from "@backpackapp-io/react-native-toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { queries as q } from "~/data/keyStore";
import { createLyric } from "~/data/lyric/api";

import { ToastOptions } from "~/lib/toast";
import { ModifyLyricBase } from "./components/ModifyViewBase";
import { linkTrackToLyric } from "./helpers/linkTrackToLyric";

type Props = StaticScreenProps<{ linkTo?: string }>;

export default function CreateLyric({
  route: {
    params: { linkTo },
  },
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();

  return (
    <ModifyLyricBase
      onSubmit={async ({ id: _, ...entry }) => {
        try {
          const newLyric = await createLyric(entry);
          if (!newLyric) throw new Error("Lyric not returned after insertion.");
          if (linkTo) {
            linkTrackToLyric(
              { name: "", trackId: linkTo, lyricId: newLyric.id },
              false,
            );
          }
          queryClient.invalidateQueries({ queryKey: q.lyrics._def });
          navigation.replace("Lyric", { id: newLyric.id });
        } catch {
          toast.error(t("err.flow.generic.title"), ToastOptions);
        }
      }}
    />
  );
}

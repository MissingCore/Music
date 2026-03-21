import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";

import { queries as q } from "~/data/keyStore";
import { createLyric } from "~/data/lyric/api";

import { toast } from "~/components/Toast";
import { ModifyLyricBase } from "./components/ModifyViewBase";
import { linkTrackToLyric } from "./helpers/linkTrackToLyric";

type Props = StaticScreenProps<{ linkTo?: string }>;

export default function CreateLyric({
  route: {
    params: { linkTo },
  },
}: Props) {
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
          toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}

import { toast } from "@missingcore/ui/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";

import { queries as q } from "~/data/keyStore";
import { createLyric } from "~/data/lyric/api";

import { pickFile } from "~/lib/file-system";
import { wait } from "~/utils/promise";
import { ModifyLyricBase } from "../components/ModifyViewBase";
import { linkTrackToLyric } from "../helpers/linkTrackToLyric";

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
      actionConfig={{
        label: "feat.backup.extra.import",
        action: async ({ setFields }) => {
          try {
            const lrcFile = await pickFile(["application/lrc", "text/plain"]);
            const lrcFileInfo = {
              name: lrcFile.name.split(".")[0],
              lyrics: await lrcFile.text(),
            };
            await wait(100);
            toast.t("feat.backup.extra.importSuccess");
            setFields(lrcFileInfo);
          } catch (err) {
            toast.error((err as Error).message);
          }
        },
      }}
      onSubmit={async (entry) => {
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

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";

import { queries as q } from "~/data/keyStore";
import { updateLyric } from "~/data/lyric/api";
import { useLyric } from "~/data/lyric/queries";

import { PagePlaceholder } from "~/navigation/components/Placeholder";

import Toast from "~/components/Toast";
import { ModifyLyricBase } from "./components/ModifyViewBase";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyLyric({
  route: {
    params: { id: lyricId },
  },
}: Props) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isPending, error, data } = useLyric(lyricId);

  if (isPending || error || !data)
    return <PagePlaceholder isPending={isPending} />;

  const initData = { id: lyricId, name: data.name, lyrics: data.lyrics };

  return (
    <ModifyLyricBase
      mode="edit"
      initialData={initData}
      onSubmit={async ({ id: _, ...entry }) => {
        try {
          await updateLyric(lyricId, entry);

          queryClient.resetQueries({ queryKey: q.lyrics._def });
          navigation.goBack();
        } catch {
          Toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}

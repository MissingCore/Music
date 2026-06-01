import { toast } from "@missingcore/ui/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";

import { queries as q } from "~/data/keyStore";
import { deleteLyric, updateLyric } from "~/data/lyric/api";
import { useLyric } from "~/data/lyric/queries";

import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { wait } from "~/utils/promise";
import { ModifyLyricBase } from "../components/ModifyViewBase";

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

  const initData = { name: data.name, lyrics: data.lyrics };

  return (
    <ModifyLyricBase
      initialData={initData}
      actionConfig={{
        label: "form.delete",
        action: async () => {
          await wait(1);
          try {
            await deleteLyric(lyricId);
            queryClient.invalidateQueries({ queryKey: q.lyrics._def });
            navigation.goBack();
            navigation.goBack();
          } catch {
            toast.tError("err.flow.generic.title");
          }
        },
        danger: true,
      }}
      onSubmit={async (entry) => {
        try {
          await updateLyric(lyricId, entry);
          queryClient.resetQueries({ queryKey: q.lyrics._def });
          navigation.goBack();
        } catch {
          toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}

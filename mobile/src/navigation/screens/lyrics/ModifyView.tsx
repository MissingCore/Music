import { toast } from "@backpackapp-io/react-native-toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useTranslation } from "react-i18next";

import { db } from "~/db";
import { lyrics } from "~/db/schema";

import { queries as q } from "~/queries/keyStore";
import { useLyric } from "~/queries/lyric";

import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { ToastOptions } from "~/lib/toast";
import { ModifyLyricBase } from "./ModifyViewBase";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyLyric({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const { isPending, error, data } = useLyric(id);

  if (isPending || error || !data)
    return <PagePlaceholder isPending={isPending} />;

  const initData = { id, name: data.name, lyrics: data.lyrics };

  return (
    <ModifyLyricBase
      mode="edit"
      initialData={initData}
      onSubmit={async (data) => {
        try {
          const entry = { name: data.name, lyrics: data.lyrics };
          await db.update(lyrics).set(entry).where(eq(lyrics.id, id));

          queryClient.resetQueries({ queryKey: q.lyrics._def });
          navigation.goBack();
          // If lyric name changed, see the new lyric page.
          if (initData.name !== data.name) navigation.replace("Lyric", { id });
        } catch {
          toast.error(t("err.flow.generic.title"), ToastOptions);
        }
      }}
    />
  );
}

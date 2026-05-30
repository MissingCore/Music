import { toast } from "@missingcore/ui/toast";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";

import { queries as q } from "~/data/keyStore";
import { createPlaylist } from "~/data/playlist/api";

import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { wait } from "~/utils/promise";
import { readM3UPlaylist } from "~/modules/backup/M3U";
import {
  ModifyPlaylistBase,
  usePreloadReferenceData,
} from "./components/ModifyViewBase";

export default function CreatePlaylist() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const { isPending, error, data } = usePreloadReferenceData();

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;
  return (
    <ModifyPlaylistBase
      referenceData={data}
      actionConfig={{
        label: "feat.playlist.extra.m3uImport",
        action: async ({ setFields }) => {
          try {
            const { name, tracks: playlistTracks } = await readM3UPlaylist();
            await wait(100);
            toast.t("feat.backup.extra.importSuccess");
            setFields((prev) => ({
              name: name || prev.name,
              trackIds: playlistTracks.map((t) => t.id),
            }));
          } catch (err) {
            toast.error((err as Error).message);
          }
        },
      }}
      onSubmit={async ({ name, trackIds }) => {
        try {
          await createPlaylist({
            name,
            tracks: trackIds.map((id) => ({ id })),
          });

          queryClient.invalidateQueries({ queryKey: q.playlists._def });
          queryClient.invalidateQueries({ queryKey: q.tracks._def });
          queryClient.invalidateQueries({ queryKey: ["search"] });
          navigation.replace("Playlist", { id: name });
        } catch {
          toast.tError("err.flow.generic.title");
        }
      }}
    />
  );
}

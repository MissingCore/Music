import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";

import { queries as q } from "~/data/keyStore";
import { createPlaylist } from "~/data/playlist/api";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import {
  ModifyPlaylistBase,
  usePreloadReferenceData,
} from "./components/ModifyViewBase";

import { toast } from "~/components/Toast";

export default function CreatePlaylist() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const { isPending, error, data } = usePreloadReferenceData();

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;
  return (
    <ModifyPlaylistBase
      referenceData={data}
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

import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import { BottomSheetFlatList, BottomSheetFooter } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { db } from "@/db";
import { useAddTrackToPlaylists } from "@/features/playlist/api/addTrackToPlaylists";
import { usePlaylists } from "@/features/playlist/api/getPlaylists";

import Colors from "@/constants/Colors";
import { cn } from "@/lib/style";
import { mutateGuard } from "@/lib/react-query";
import { ActionButton } from "@/components/ui/ActionButton";
import { getTrackCountStr } from "@/features/track/utils";
import { ModalBase } from "../components/ModalBase";
import { ModalFormButton } from "../components/ModalFormButton";

/** @description Modal used for adding or removing a track from a playlist. */
export function TrackToPlaylistModal({ trackId }: { trackId: string }) {
  const { isPending, error, data } = usePlaylists();
  const [inPlaylist, setInPlaylist] = useState<Record<string, boolean>>({});
  const addTrackToPlaylists = useAddTrackToPlaylists(trackId);

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props}>
        <View
          className={cn(
            "mx-6 flex-row justify-end gap-2 pb-6 pt-2",
            "border-t border-t-surface500 bg-surface800",
          )}
        >
          <ModalFormButton content="CANCEL" />
          <ModalFormButton
            onPress={() => mutateGuard(addTrackToPlaylists, inPlaylist)}
            content="CONFIRM"
            className="border-surface500 bg-surface500 active:border-surface700"
          />
        </View>
      </BottomSheetFooter>
    ),
    [addTrackToPlaylists, inPlaylist],
  );

  useEffect(() => {
    async function getTracksToPlaylist() {
      if (!data) return;
      // Get all playlist names & create the initial `inPlaylist` object.
      const playlistNames = data.map(({ name }) => name);
      const initInPlaylist = Object.fromEntries(
        playlistNames.map((name) => [name, false]),
      );
      // Get all playlists track is in (look in `tracksToPlaylists` table)
      const inPlaylists = await db.query.tracksToPlaylists.findMany({
        where: (fields, { eq }) => eq(fields.trackId, trackId),
        columns: { playlistName: true },
      });
      inPlaylists.forEach(({ playlistName }) => {
        initInPlaylist[playlistName] = true;
      });

      setInPlaylist(initInPlaylist);
    }

    getTracksToPlaylist();
  }, [data, trackId]);

  if (isPending || error) return null;

  return (
    <ModalBase footerComponent={renderFooter}>
      <Text className="mb-4 px-6 text-center font-ndot57 text-title text-foreground50">
        Add Track to Playlist
      </Text>
      <BottomSheetFlatList
        data={data}
        keyExtractor={({ name }) => name}
        renderItem={({ item }) => (
          <PlaylistCheckbox
            selected={inPlaylist[item.name]}
            toggleSelf={() =>
              setInPlaylist((prev) => ({
                ...prev,
                [item.name]: !prev[item.name],
              }))
            }
            name={item.name}
            numTracks={item.numTracks}
          />
        )}
        ListEmptyComponent={
          <Text className="mb-2 text-center font-geistMonoLight text-base text-foreground100">
            No Playlists Found
          </Text>
        }
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pb-16"
      />
    </ModalBase>
  );
}

type PlaylistCheckboxProps = {
  selected: boolean;
  toggleSelf: () => void;
  name: string;
  numTracks: number;
};

/** @description Toggleable checkbox to see if track should be in playlist. */
function PlaylistCheckbox(props: PlaylistCheckboxProps) {
  return (
    <ActionButton
      onPress={props.toggleSelf}
      textContent={[props.name, getTrackCountStr(props.numTracks)]}
      icon={
        <Ionicons
          name={props.selected ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={Colors.foreground50}
        />
      }
      className="active:bg-surface700"
    />
  );
}

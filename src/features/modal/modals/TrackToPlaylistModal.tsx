import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import { BottomSheetFooter, BottomSheetView } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";

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
import { Title } from "../components/ModalUI";

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
            "mx-4 flex-row justify-end gap-2 pb-6 pt-2",
            "border-t border-t-surface500 bg-surface800",
          )}
        >
          <ModalFormButton content="CANCEL" />
          <ModalFormButton
            theme="secondary"
            onPress={() => mutateGuard(addTrackToPlaylists, inPlaylist)}
            content="CONFIRM"
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
      <BottomSheetView className="px-4">
        <Title className="mb-4">Add Track to Playlist</Title>
        <FlatList
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
          contentContainerClassName="pb-16"
        />
      </BottomSheetView>
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

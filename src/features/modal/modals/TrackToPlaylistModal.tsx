import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import { BottomSheetFooter, BottomSheetView } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";

import { usePlaylistsForModal } from "@/api/playlists";
import {
  usePutTrackInPlaylists,
  useTrackInPlaylists,
} from "@/api/tracks/[id]/playlist";

import Colors from "@/constants/Colors";
import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { ActionButton } from "@/components/ui/ActionButton";
import { getTrackCountStr } from "@/features/track/utils";
import { ModalBase } from "../components/ModalBase";
import { ModalFormButton } from "../components/ModalFormButton";
import { Title } from "../components/ModalUI";

/** @description Modal used for adding or removing a track from a playlist. */
export function TrackToPlaylistModal({ trackId }: { trackId: string }) {
  const { isPending, error, data: playlistData } = usePlaylistsForModal();
  const trackInPlaylists = useTrackInPlaylists({ trackId });
  const [inPlaylist, setInPlaylist] = useState<Record<string, boolean>>({});
  const putTrackInPlaylistsFn = usePutTrackInPlaylists(trackId);

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
            onPress={() => {
              const playlistNames = Object.entries(inPlaylist)
                .filter(([_name, status]) => status)
                .map(([name]) => name);
              return mutateGuard(putTrackInPlaylistsFn, playlistNames);
            }}
            content="CONFIRM"
          />
        </View>
      </BottomSheetFooter>
    ),
    [putTrackInPlaylistsFn, inPlaylist],
  );

  useEffect(() => {
    async function getTracksToPlaylist() {
      if (!playlistData || !trackInPlaylists.data) return;
      // Get all playlist names & create the initial `inPlaylist` object.
      const initInPlaylist = Object.fromEntries(
        playlistData.map(({ name }) => name).map((name) => [name, false]),
      );
      // Indicate the playlists the track is in.
      trackInPlaylists.data
        .map(({ name }) => name)
        .forEach((playlistName) => (initInPlaylist[playlistName] = true));

      setInPlaylist(initInPlaylist);
    }

    getTracksToPlaylist();
  }, [playlistData, trackInPlaylists.data]);

  if (trackInPlaylists.isPending || trackInPlaylists.error) return null;
  if (isPending || error) return null;

  return (
    <ModalBase footerComponent={renderFooter}>
      <BottomSheetView className="px-4">
        <Title className="mb-4">Add Track to Playlist</Title>
        <FlatList
          data={playlistData}
          keyExtractor={({ name }) => name}
          renderItem={({ item: { name, trackCount } }) => (
            <PlaylistCheckbox
              selected={inPlaylist[name]}
              toggleSelf={() =>
                setInPlaylist((prev) => ({ ...prev, [name]: !prev[name] }))
              }
              {...{ name, trackCount }}
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
  trackCount: number;
};

/** @description Toggleable checkbox to see if track should be in playlist. */
function PlaylistCheckbox(props: PlaylistCheckboxProps) {
  return (
    <ActionButton
      onPress={props.toggleSelf}
      textContent={[props.name, getTrackCountStr(props.trackCount)]}
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

import type { BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import { BottomSheetScrollView, BottomSheetFooter } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { Suspense, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { usePlaylistsForModal } from "@/api/playlists";
import {
  usePutTrackInPlaylists,
  useTrackInPlaylists,
} from "@/api/tracks/[id]/playlist";

import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { CheckboxField } from "@/components/form/CheckboxField";
import { Loading } from "@/components/ui/Loading";
import { getTrackCountStr } from "@/features/track/utils";
import { ModalBase } from "../components/ModalBase";
import { ModalFormButton } from "../components/ModalFormButton";
import { Title } from "../components/ModalUI";

const inPlaylistAtom = atom<string[]>([]);

/** @description Modal used for adding or removing a track from a playlist. */
export function TrackToPlaylistModal({ trackId }: { trackId: string }) {
  return (
    <ModalBase
      footerComponent={(props) => <ModalFooter trackId={trackId} {...props} />}
    >
      <Title className="bg-surface800 p-4 pt-0">Add Track to Playlist</Title>
      <BottomSheetScrollView contentContainerClassName="px-4 pb-16">
        <Suspense fallback={<Loading />}>
          <PlaylistList trackId={trackId} />
        </Suspense>
      </BottomSheetScrollView>
    </ModalBase>
  );
}

type PlaylistRelation = Array<{
  name: string;
  trackCount: number;
  checked: boolean;
}>;

/** @description Lists all the playlists. */
function PlaylistList({ trackId }: { trackId: string }) {
  const { isPending, error, data: playlistData } = usePlaylistsForModal();
  const trackInPlaylists = useTrackInPlaylists({ trackId });
  const [playlistRelation, setPlaylistRelation] = useState<PlaylistRelation>(
    [],
  );
  const setInPlaylist = useSetAtom(inPlaylistAtom);

  useEffect(() => {
    async function getTracksToPlaylist() {
      if (!playlistData || !trackInPlaylists.data) return;
      setPlaylistRelation(
        playlistData.map((data) => ({
          ...data,
          checked: trackInPlaylists.data.includes(data.name),
        })),
      );
    }

    getTracksToPlaylist();
  }, [playlistData, trackInPlaylists.data]);

  if (isPending || error) return null;

  return (
    <FlashList
      estimatedItemSize={66} // 58px Height + 8px Margin Bottom
      data={playlistRelation}
      keyExtractor={({ name }) => name}
      renderItem={({ item: { name, trackCount, checked } }) => (
        <CheckboxField
          checked={checked}
          onPress={() =>
            setPlaylistRelation((prev) => {
              // Need to update Jotai atom in this roundabout way as when we
              // update the atom and use that atom in the FlashList, it doesn't
              // update the `<CheckboxField />` when it updates.
              if (checked) {
                setInPlaylist((prev) => prev.filter((id) => id !== name));
                return prev.map((data) => {
                  if (data.name !== name) return data;
                  else return { ...data, checked: false };
                });
              } else {
                setInPlaylist((prev) => [...prev, name]);
                return prev.map((data) => {
                  if (data.name !== name) return data;
                  else return { ...data, checked: true };
                });
              }
            })
          }
          textContent={[name, getTrackCountStr(trackCount)]}
        />
      )}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <Text className="text-center font-geistMonoLight text-base text-foreground100">
          No Playlists Found
        </Text>
      }
    />
  );
}

type ModalFooterProps = BottomSheetFooterProps & { trackId: string };

/** @description Contains buttons to close the modal or submit changes. */
function ModalFooter({ trackId, ...props }: ModalFooterProps) {
  const inPlaylist = useAtomValue(inPlaylistAtom);
  const putTrackInPlaylistsFn = usePutTrackInPlaylists(trackId);
  return (
    <BottomSheetFooter {...props}>
      <View
        className={cn(
          "mx-4 flex-row justify-end gap-2 pb-6 pt-2",
          "border-t border-t-surface500 bg-surface800",
        )}
      >
        <ModalFormButton content="CANCEL" />
        <ModalFormButton
          theme="neutral"
          onPress={() => mutateGuard(putTrackInPlaylistsFn, inPlaylist)}
          content="CONFIRM"
        />
      </View>
    </BottomSheetFooter>
  );
}

import type { BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import { BottomSheetScrollView, BottomSheetFooter } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { atom, useAtom, useAtomValue } from "jotai";
import { Suspense, useEffect } from "react";
import { View } from "react-native";

import { usePlaylistsForModal } from "@/api/playlists";
import {
  usePutTrackInPlaylists,
  trackInPlaylistsOptions,
} from "@/api/tracks/[id]/playlist";

import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { CheckboxField } from "@/components/form/checkbox-field";
import { LoadingIndicator } from "@/components/ui/loading";
import { Description, Heading } from "@/components/ui/text";
import { getTrackCountStr } from "@/features/track/utils";
import { ModalFormButton } from "../components/form-button";
import { ModalBase } from "../components/modal-base";

const inPlaylistAtom = atom<string[]>([]);

/** @description Modal used for adding or removing a track from a playlist. */
export function TrackToPlaylistModal({ id }: { id: string }) {
  return (
    <ModalBase
      footerComponent={(props) => <ModalFooter trackId={id} {...props} />}
    >
      <Heading as="h1" className="p-4 pt-0">
        Add Track to Playlist
      </Heading>
      <BottomSheetScrollView
        enableFooterMarginAdjustment
        contentContainerClassName="px-4"
      >
        <Suspense fallback={<LoadingIndicator />}>
          <PlaylistList trackId={id} />
        </Suspense>
      </BottomSheetScrollView>
    </ModalBase>
  );
}

/** @description Lists all the playlists. */
function PlaylistList({ trackId }: { trackId: string }) {
  const { isPending, error, data: playlistData } = usePlaylistsForModal();
  const trackInPlaylists = useQuery(trackInPlaylistsOptions(trackId));
  const [inPlaylist, setInPlaylist] = useAtom(inPlaylistAtom);

  useEffect(() => {
    async function getTracksToPlaylist() {
      if (trackInPlaylists.data) setInPlaylist(trackInPlaylists.data);
    }
    getTracksToPlaylist();
  }, [setInPlaylist, trackInPlaylists.data]);

  if (isPending || error) return null;

  return (
    <FlashList
      estimatedItemSize={66} // 58px Height + 8px Margin Bottom
      data={[...playlistData]}
      keyExtractor={({ name }) => name}
      renderItem={({ item: { name, trackCount } }) => (
        <View className="mb-2">
          <CheckboxField
            checked={inPlaylist.includes(name)}
            onPress={() =>
              setInPlaylist((prev) =>
                prev.includes(name)
                  ? prev.filter((id) => id !== name)
                  : [...prev, name],
              )
            }
            textContent={[name, getTrackCountStr(trackCount)]}
          />
        </View>
      )}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<Description>No Playlists Found</Description>}
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
          "mx-4 flex-row justify-end gap-2 py-4",
          "border-t border-t-surface500 bg-surface800",
        )}
      >
        <ModalFormButton variant="outline">CANCEL</ModalFormButton>
        <ModalFormButton
          theme="neutral"
          onPress={() => mutateGuard(putTrackInPlaylistsFn, inPlaylist)}
        >
          CONFIRM
        </ModalFormButton>
      </View>
    </BottomSheetFooter>
  );
}

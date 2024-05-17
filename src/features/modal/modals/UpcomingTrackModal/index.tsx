import Ionicons from "@expo/vector-icons/Ionicons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useAtomValue, useSetAtom } from "jotai";
import { Suspense } from "react";
import { View } from "react-native";

import type { Track } from "@/db/schema";

import { trackDataAtom } from "@/features/playback/api/track";
import { queueRemoveAtIdxAtom } from "@/features/playback/api/queue";
import { nextTrackListAtom, queueTrackListAtom } from "./store";

import { Colors } from "@/constants/Styles";
import { pickKeys } from "@/utils/object";
import { ActionButton } from "@/components/form/ActionButton";
import { MediaImage } from "@/components/media/MediaImage";
import { Loading } from "@/components/ui/Loading";
import { Description, Heading } from "@/components/ui/Text";
import { ModalBase } from "../../components/ModalBase";

type TrackExcerpt = Pick<Track, "id" | "artistName" | "name" | "artwork">;

/** @description Modal used for seeing upcoming tracks. */
export function UpcomingTrackModal() {
  return (
    <ModalBase>
      <BottomSheetScrollView className="px-4">
        <Heading as="h1" className="mb-2 text-start">
          Now Playing
        </Heading>
        <Suspense fallback={<Loading />}>
          <CurrentTrack />
        </Suspense>

        <Heading as="h1" className="mb-2 text-start">
          Next in Queue
        </Heading>
        <Suspense fallback={<Loading />}>
          <QueueListTracks />
        </Suspense>

        <Heading as="h1" className="mb-2 text-start">
          Next 5 Tracks
        </Heading>
        <Suspense fallback={<Loading />}>
          <NextTracks />
        </Suspense>
      </BottomSheetScrollView>
    </ModalBase>
  );
}

/** @description Displays the current track. */
function CurrentTrack() {
  const data = useAtomValue(trackDataAtom);
  if (!data) return <EmptyMessage />;
  return (
    <UpcomingTrack
      data={pickKeys(data, ["id", "name", "artistName", "artwork"])}
    />
  );
}

/** @description List out tracks in the queue, giving us the ability to remove them. */
function QueueListTracks() {
  const data = useAtomValue(queueTrackListAtom);
  const removeQueueIdx = useSetAtom(queueRemoveAtIdxAtom);
  return (
    <FlashList
      estimatedItemSize={66} // 58px Height + 8px Margin Bottom
      data={data}
      keyExtractor={({ id }, index) => `${id}${index}`}
      renderItem={({ item, index }) => (
        <UpcomingTrack data={item} onPress={() => removeQueueIdx(index)} />
      )}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={EmptyMessage}
    />
  );
}

/** @description Displays up to the next 5 tracks. */
function NextTracks() {
  const data = useAtomValue(nextTrackListAtom);
  return (
    <FlashList
      estimatedItemSize={66} // 58px Height + 8px Margin Bottom
      data={data}
      keyExtractor={({ id }, index) => `${id}${index}`}
      renderItem={({ item }) => <UpcomingTrack data={item} />}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={EmptyMessage}
    />
  );
}

type UpcomingTrackProps =
  | { data: TrackExcerpt; onPress?: never }
  | { data: TrackExcerpt; onPress: () => void };

/** @description Render the "data" for a "section" in a `<FlashList />`. */
function UpcomingTrack({ data, onPress }: UpcomingTrackProps) {
  const inQueue = !!onPress;
  return (
    <View className="mb-2">
      <ActionButton
        onPress={inQueue ? onPress : undefined}
        textContent={[data.name, data.artistName]}
        Image={
          <MediaImage
            type="track"
            size={48}
            source={data.artwork}
            className="shrink-0 rounded-sm"
          />
        }
        Icon={
          inQueue ? (
            <Ionicons
              name="remove-circle-outline"
              size={24}
              color={Colors.accent50}
            />
          ) : undefined
        }
        withoutIcon={!inQueue}
      />
    </View>
  );
}

/** @description Render if there's no tracks. */
function EmptyMessage() {
  return <Description className="mb-2 text-start">No Tracks Found</Description>;
}

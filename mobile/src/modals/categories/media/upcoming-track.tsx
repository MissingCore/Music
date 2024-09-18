import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { Suspense } from "react";
import { View } from "react-native";

import type { Track } from "@/db/schema";

import { Ionicons } from "@/resources/icons";
import { Queue, useMusicStore } from "@/modules/media/services/Music";

import { Colors } from "@/constants/Styles";
import { pickKeys } from "@/utils/object";
import { ActionButton } from "@/components/form/action-button";
import { MediaImage } from "@/components/media/image";
import { LoadingIndicator } from "@/components/ui/loading";
import { Description, Heading } from "@/components/ui/text";
import { ModalBase } from "../../components/base";

type TrackExcerpt = Pick<Track, "id" | "artistName" | "name" | "artwork">;

/** Modal used for seeing upcoming tracks. */
export function UpcomingTrackModal() {
  return (
    <ModalBase>
      <BottomSheetScrollView className="px-4">
        <Heading as="h3" className="mb-2 text-start">
          Now Playing
        </Heading>
        <Suspense fallback={<LoadingIndicator />}>
          <CurrentTrack />
        </Suspense>

        <Heading as="h3" className="mb-2 text-start">
          Next in Queue
        </Heading>
        <Suspense fallback={<LoadingIndicator />}>
          <QueueListTracks />
        </Suspense>

        <Heading as="h3" className="mb-2 text-start">
          Next 5 Tracks
        </Heading>
        <Suspense fallback={<LoadingIndicator />}>
          <NextTracks />
        </Suspense>
      </BottomSheetScrollView>
    </ModalBase>
  );
}

/** Displays the current track. */
function CurrentTrack() {
  const track = useMusicStore((state) => state.activeTrack);
  if (!track) return <EmptyMessage />;
  return (
    <UpcomingTrack
      data={pickKeys(track, ["id", "name", "artistName", "artwork"])}
    />
  );
}

/** List out tracks in the queue, giving us the ability to remove them. */
function QueueListTracks() {
  const data = useMusicStore((state) => state.queuedTrackList);
  return (
    <FlashList
      estimatedItemSize={66} // 58px Height + 8px Margin Bottom
      data={data}
      keyExtractor={({ id }, index) => `${id}${index}`}
      renderItem={({ item, index }) => (
        <UpcomingTrack data={item} onPress={() => Queue.removeAtIndex(index)} />
      )}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={EmptyMessage}
    />
  );
}

/** Displays up to the next 5 tracks. */
function NextTracks() {
  const currIdx = useMusicStore((state) => state.listIdx);
  const currTracks = useMusicStore((state) => state.currentTrackList);

  const data = [...currTracks].slice(currIdx + 1, currIdx + 6);

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

/** Render the "data" for a "section" in a `<FlashList />`. */
function UpcomingTrack({ data, onPress }: UpcomingTrackProps) {
  const inQueue = !!onPress;
  return (
    <View className="mb-2">
      <ActionButton
        onPress={undefined}
        textContent={[data.name, data.artistName ?? "No Artist"]}
        Image={
          <MediaImage
            type="track"
            size={48}
            source={data.artwork}
            className="shrink-0 rounded-sm"
          />
        }
        icon={{
          Element: inQueue ? (
            <Ionicons name="remove-circle-outline" color={Colors.accent50} />
          ) : undefined,
          onPress: inQueue ? onPress : undefined,
          label: inQueue ? "Remove track from queue." : undefined,
        }}
        withoutIcon={!inQueue}
      />
    </View>
  );
}

/** Render if there's no tracks. */
function EmptyMessage() {
  return (
    <Description className="mb-2 text-start text-sm">
      No Tracks Found
    </Description>
  );
}

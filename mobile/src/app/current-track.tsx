import { Stack } from "expo-router";
import { eq } from "drizzle-orm";
import { atom, useAtomValue } from "jotai";
import { unwrap } from "jotai/utils";
import { useMemo, useState } from "react";
import { View, useWindowDimensions } from "react-native";

import { albums } from "@/db/schema";
import { getAlbum } from "@/db/queries";

import { AsyncAtomState, SyncAtomState } from "@/modules/media/services/State";

import { AnimatedVinyl } from "@/components/media/animated-vinyl";
import { Back } from "@/components/navigation/back";
import { Heading, TextLine } from "@/components/ui/text";
import { ReservedPlaylists } from "@/modules/media/constants/ReservedNames";
import {
  NextButton,
  PlayToggleButton,
  PreviousButton,
  RepeatButton,
  ShuffleButton,
} from "@/modules/media/components/MediaControls";
import { SeekBar } from "@/modules/media/components/SeekBar";

/** Screen for `/current-track` route. */
export default function CurrentTrackScreen() {
  const { width } = useWindowDimensions();
  const track = useAtomValue(SyncAtomState.activeTrack);
  const listName = useAtomValue(playlistNameAtom);
  const isPlaying = useAtomValue(SyncAtomState.isPlaying);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [infoHeight, setInfoHeight] = useState<number | null>(null);

  const availableLength = useMemo(() => {
    if (pageHeight === null || infoHeight === null) return undefined;
    // Exclude the vertical padding on container plus a bit more.
    const usedHeight = pageHeight - infoHeight - 48;
    const imgSize = (usedHeight * 2) / 3;
    return imgSize > width - 32 ? (width - 32) * 1.5 : usedHeight;
  }, [width, pageHeight, infoHeight]);

  if (!track) return <Back />;

  return (
    <>
      <Stack.Screen options={{ headerTitle: listName }} />
      <View
        onLayout={({ nativeEvent }) => setPageHeight(nativeEvent.layout.height)}
        className="flex-1 items-center px-4 py-8"
      >
        {availableLength !== undefined && (
          <AnimatedVinyl
            placement="bottom"
            source={track.artwork}
            availableLength={availableLength}
            delay={300}
            shouldSpin={isPlaying}
          />
        )}

        <View
          onLayout={({ nativeEvent }) =>
            setInfoHeight(nativeEvent.layout.height)
          }
          className="mt-auto w-full items-center"
        >
          <View className="w-full px-4">
            <Heading
              as="h3"
              numberOfLines={2}
              className="h-[58px] align-bottom"
            >
              {track.name}
            </Heading>
            <TextLine className="text-center font-geistMonoLight text-base text-accent50">
              {track.artistName}
            </TextLine>
          </View>

          <SeekBar duration={track.duration} />

          <View className="flex-row items-center gap-2 p-4 pb-8">
            <ShuffleButton size={32} />
            <PreviousButton size={32} />
            <PlayToggleButton size={32} className="px-5" />
            <NextButton size={32} />
            <RepeatButton size={32} />
          </View>
        </View>
      </View>
    </>
  );
}

const playlistNameAsyncAtom = atom(async (get) => {
  const source = await get(AsyncAtomState.playingSource);
  if (!source) return "";
  try {
    if (
      (Object.values(ReservedPlaylists) as string[]).includes(source.id) ||
      ["artist", "playlist"].includes(source.type)
    ) {
      return source.id;
    } else if (source.type === "folder") {
      // FIXME: At `-2` index due to the folder path (in `id`) ending with
      // a trailing slash.
      return source.id.split("/").at(-2);
    } else if (source.type === "album") {
      const album = await getAlbum([eq(albums.id, source.id)]);
      return album.name;
    }
    return ""; // Fallback in case we miss anything.
  } catch {
    return ""; // In case the query throws an error.
  }
});
const playlistNameAtom = unwrap(playlistNameAsyncAtom, (prev) => prev ?? "");

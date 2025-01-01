import { router, usePathname } from "expo-router";
import type { ParseKeys } from "i18next";
import { Pressable, View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import type { TrackWithAlbum } from "@/db/schema";

import { Album } from "@/icons/Album";
import { Artist } from "@/icons/Artist";
import { Favorite } from "@/icons/Favorite";
import { List } from "@/icons/List";
import { PlaylistAdd } from "@/icons/PlaylistAdd";
import { QueueMusic } from "@/icons/QueueMusic";
import { Schedule } from "@/icons/Schedule";
import { useTrack, useFavoriteTrack } from "@/queries/track";
import { useGetColumn } from "@/hooks/useGetColumn";
import { useTheme } from "@/hooks/useTheme";
import { Queue, useMusicStore } from "@/modules/media/services/Music";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import {
  abbreviateBitRate,
  abbreviateSize,
  formatEpoch,
  formatSeconds,
} from "@/utils/number";
import { Divider } from "@/components/Containment/Divider";
import { Marquee } from "@/components/Containment/Marquee";
import { IconButton } from "@/components/Form/Button";
import { Sheet } from "@/components/Sheet";
import {
  StyledText,
  TEm,
  TStyledText,
} from "@/components/Typography/StyledText";
import { ReservedPlaylists } from "@/modules/media/constants";
import { MediaImage } from "@/modules/media/components/MediaImage";

/** Sheet containing information and actions for a track. */
export default function TrackSheet(props: { payload: { id: string } }) {
  const { isPending, error, data } = useTrack(props.payload.id);
  return (
    <Sheet id="TrackSheet" contentContainerClassName="gap-4">
      {isPending || error ? null : (
        <>
          <TrackIntro data={data} />
          <Divider />
          <Stats data={data} />
          <Divider />
          <AddActions data={data} />
          <TrackLinks data={data} />
        </>
      )}
    </Sheet>
  );
}

//#region Track Introduction
/** Contains the favorite toggle. */
function TrackIntro({ data }: { data: TrackWithAlbum }) {
  const favoriteTrack = useFavoriteTrack(data.id);
  const { foreground } = useTheme();

  const isFav = favoriteTrack.isPending ? !data.isFavorite : data.isFavorite;

  return (
    <View className="flex-row gap-2">
      <Pressable
        onPress={() => mutateGuard(favoriteTrack, !data.isFavorite)}
        className="relative flex-row items-center rounded active:opacity-75"
      >
        <MediaImage
          type="track"
          size={98}
          source={data.artwork}
          className="rounded"
        />
        <View className="absolute right-1 top-1 rounded-full bg-neutral0/75 p-1">
          <Favorite size={16} color={Colors.neutral100} filled={isFav} />
        </View>
      </Pressable>

      <View className="shrink self-end">
        {data.artistName ? (
          <Marquee>
            <StyledText dim>{data.artistName}</StyledText>
          </Marquee>
        ) : null}
        <Marquee>
          <StyledText>{data.name}</StyledText>
        </Marquee>
        {data.album ? (
          <Marquee>
            <StyledText dim className="text-xxs">
              {data.album.name}
            </StyledText>
          </Marquee>
        ) : null}
        <Marquee wrapperClassName="mt-2">
          <View className="flex-row items-center">
            <Schedule size={12} color={`${foreground}80`} />
            <StyledText dim className="text-xxs">
              {` ${formatSeconds(data.duration)}`}
              {data.format ? ` | ${data.format}` : undefined}
            </StyledText>
          </View>
        </Marquee>
      </View>
    </View>
  );
}
//#endregion

//#region Stats
/** Display stats about the file. */
function Stats({ data }: { data: TrackWithAlbum }) {
  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        <StatItem
          titleKey="trackModal.bitrate"
          description={
            data.bitrate !== null ? abbreviateBitRate(data.bitrate) : "—"
          }
        />
        <StatItem
          titleKey="trackModal.sampleRate"
          description={data.sampleRate !== null ? `${data.sampleRate} Hz` : "—"}
        />
      </View>
      <View className="flex-row gap-2">
        <StatItem
          titleKey="trackModal.size"
          description={abbreviateSize(data.size)}
        />
        <StatItem
          titleKey="trackModal.modified"
          description={formatEpoch(data.modificationTime)}
        />
      </View>
      <View className="flex-row">
        <StatItem titleKey="trackModal.filePath" description={data.uri} />
      </View>
    </View>
  );
}
//#endregion

//#region Add Actions
/** Add track to a playlist or queue. */
function AddActions({ data }: { data: TrackWithAlbum }) {
  return (
    <View className="flex-row gap-2">
      <SheetButton
        onPress={() =>
          SheetManager.show("TrackToPlaylistSheet", {
            payload: { id: data.id },
          })
        }
        Icon={<PlaylistAdd />}
        textKey="playlist.add"
        preventClose
      />
      <SheetButton
        onPress={() => Queue.add({ id: data.id, name: data.name })}
        Icon={<QueueMusic />}
        textKey="trackModal.queueAdd"
      />
    </View>
  );
}
//#endregion

//#region Track Links
function TrackLinks({ data }: { data: TrackWithAlbum }) {
  const pathname = usePathname();
  const playingSource = useMusicStore((state) => state.playingSource);
  const playingList = useMusicStore((state) => state.playingList);

  const canShowPlaylistBtn =
    pathname === "/current-track" && playingSource?.type === "playlist";
  const isInList = playingList.some((id) => id === data.id);

  // Don't render the last `<Divider />` if there's no content in this row.
  if (!data.artistName && !data.album && (!canShowPlaylistBtn || !isInList)) {
    return null;
  }

  return (
    <>
      <Divider />
      <View className="flex-row flex-wrap gap-2">
        {data.artistName ? (
          <SheetButton
            onPress={() => router.navigate(`/artist/${data.artistName}`)}
            Icon={<Artist />}
            textKey="common.artist"
          />
        ) : null}
        {data.album ? (
          <SheetButton
            onPress={() => router.navigate(`/album/${data.album?.id}`)}
            Icon={<Album />}
            textKey="common.album"
          />
        ) : null}
        {canShowPlaylistBtn && isInList ? (
          <SheetButton
            onPress={() =>
              router.navigate(
                playingSource?.id === ReservedPlaylists.tracks
                  ? "/track"
                  : `/playlist/${encodeURIComponent(playingSource?.id ?? "")}`,
              )
            }
            Icon={<List />}
            textKey="common.playlist"
          />
        ) : null}
      </View>
    </>
  );
}
//#endregion

//#region Stat Item
/** Represents a statistical piece of information about the file. */
function StatItem(props: { titleKey: ParseKeys; description: string }) {
  return (
    <View className="flex-1">
      <Marquee>
        <TEm dim textKey={props.titleKey} />
      </Marquee>
      <Marquee>
        <StyledText className="text-xs">{props.description}</StyledText>
      </Marquee>
    </View>
  );
}
//#endregion

//#region Sheet Button
/** Clicking this button will also close the model */
function SheetButton(props: {
  onPress: () => void;
  Icon: React.JSX.Element;
  textKey: ParseKeys;
  preventClose?: boolean;
}) {
  const { width } = useGetColumn({ cols: 2, gap: 8, gutters: 32 });
  return (
    <IconButton
      kind="extended"
      onPress={() => {
        if (!props.preventClose) SheetManager.hide("TrackSheet");
        props.onPress();
      }}
      style={{ width }}
      className="p-2"
    >
      {props.Icon}
      <TStyledText textKey={props.textKey} className="shrink text-xs" />
    </IconButton>
  );
}
//#endregion

import { router, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { SheetManager, type SheetProps } from "react-native-actions-sheet";

import type { TrackWithAlbum } from "@/db/schema";

import {
  Album,
  Artist,
  Favorite,
  List,
  PlaylistAdd,
  QueueMusic,
  Schedule,
} from "@/icons";
import { useTrack, useFavoriteTrack } from "@/queries/track";
import { useGetColumn } from "@/hooks/useGetColumn";
import { Queue, useMusicStore } from "@/modules/media/services/Music";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import {
  abbreviateBitRate,
  abbreviateSize,
  formatEpoch,
  formatSeconds,
} from "@/utils/number";
import { Divider, Marquee } from "@/components/Containment";
import { IconButton } from "@/components/Form";
import { Sheet } from "@/components/Sheet";
import { StyledText } from "@/components/Typography";
import { ReservedPlaylists } from "@/modules/media/constants";
import { MediaImage } from "@/modules/media/components";

/** Sheet containing information and actions for a track. */
export default function TrackSheet(props: SheetProps<"track-sheet">) {
  const { isPending, error, data } = useTrack(props.payload!.id);
  return (
    <Sheet id={props.sheetId} contentContainerClassName="gap-4">
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

  const isFav = favoriteTrack.isPending ? !data.isFavorite : data.isFavorite;

  return (
    <View className="flex-row gap-2">
      <Pressable
        onPress={() => mutateGuard(favoriteTrack, !data.isFavorite)}
        disabled={favoriteTrack.isPending}
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
            <StyledText preset="dimOnSurface">{data.artistName}</StyledText>
          </Marquee>
        ) : null}
        <Marquee>
          <StyledText>{data.name}</StyledText>
        </Marquee>
        {data.album ? (
          <Marquee>
            <StyledText preset="dimOnSurface" className="text-xxs">
              {data.album.name}
            </StyledText>
          </Marquee>
        ) : null}
        <Marquee wrapperClassName="mt-2">
          <View className="flex-row items-center">
            <Schedule size={12} />
            <StyledText preset="dimOnSurface" className="text-xxs">
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
  const { t } = useTranslation();
  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        <StatItem
          title={t("trackModal.bitrate")}
          description={
            data.bitrate !== null ? abbreviateBitRate(data.bitrate) : "—"
          }
        />
        <StatItem
          title={t("trackModal.sampleRate")}
          description={data.sampleRate !== null ? `${data.sampleRate} Hz` : "—"}
        />
      </View>
      <View className="flex-row gap-2">
        <StatItem
          title={t("trackModal.size")}
          description={abbreviateSize(data.size)}
        />
        <StatItem
          title={t("trackModal.modified")}
          description={formatEpoch(data.modificationTime)}
        />
      </View>
      <View className="flex-row">
        <StatItem title={t("trackModal.filePath")} description={data.uri} />
      </View>
    </View>
  );
}
//#endregion

//#region Add Actions
/** Add track to a playlist or queue. */
function AddActions({ data }: { data: TrackWithAlbum }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row gap-2">
      <SheetButton
        onPress={() =>
          SheetManager.show("track-to-playlist-sheet", {
            payload: { id: data.id },
          })
        }
        Icon={<PlaylistAdd />}
        text={t("playlist.add")}
        preventClose
      />
      <SheetButton
        onPress={() => Queue.add({ id: data.id, name: data.name })}
        Icon={<QueueMusic />}
        text={t("trackModal.queueAdd")}
      />
    </View>
  );
}
//#endregion

//#region Track Links
function TrackLinks({ data }: { data: TrackWithAlbum }) {
  const { t } = useTranslation();
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
            text={t("common.artist")}
          />
        ) : null}
        {data.album ? (
          <SheetButton
            onPress={() => router.navigate(`/album/${data.album?.id}`)}
            Icon={<Album />}
            text={t("common.album")}
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
            text={t("common.playlist")}
          />
        ) : null}
      </View>
    </>
  );
}
//#endregion

//#region Stat Item
/** Represents a statistical piece of information about the file. */
function StatItem(props: { title: string; description: string }) {
  return (
    <View className="flex-1">
      <Marquee>
        <StyledText preset="dimOnCanvas" bold className="text-xxs">
          {props.title.toLocaleUpperCase()}
        </StyledText>
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
  text: string;
  preventClose?: boolean;
}) {
  const { width } = useGetColumn({ cols: 2, gap: 8, gutters: 32 });
  return (
    <IconButton
      kind="extended"
      onPress={() => {
        if (!props.preventClose) SheetManager.hide("track-sheet");
        props.onPress();
      }}
      style={{ width }}
      className="p-2"
    >
      {props.Icon}
      <StyledText className="shrink text-xs">{props.text}</StyledText>
    </IconButton>
  );
}
//#endregion

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
import { useTrackExcerpt, useFavoriteTrack } from "@/queries/track";
import { useGetColumn } from "@/hooks/useGetColumn";
import { Queue, useMusicStore } from "@/modules/media/services/Music";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { formatSeconds } from "@/utils/number";
import { Divider, Marquee } from "@/components/new/Containment";
import { IconButton } from "@/components/new/Form";
import { Sheet } from "@/components/new/Sheet";
import { StyledText } from "@/components/new/Typography";
import { ReservedPlaylists } from "@/modules/media/constants";
import { MediaImage } from "@/modules/media/components";

type TrackData = Pick<
  TrackWithAlbum,
  "id" | "name" | "artistName" | "duration" | "isFavorite"
> & { imageSource: string | null; album: { id: string; name: string } | null };

/** Sheet containing information and actions for a track. */
export default function TrackSheet(props: SheetProps<"track-sheet">) {
  const { isPending, error, data } = useTrackExcerpt(props.payload!.id);
  return (
    <Sheet id={props.sheetId} contentContainerClassName="gap-4">
      {isPending || error ? null : (
        <>
          <TrackIntro data={data} />
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
function TrackIntro({ data }: { data: TrackData }) {
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
          source={data.imageSource}
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
        <View className="mt-2 flex-row items-center">
          <Schedule size={12} />
          <StyledText preset="dimOnSurface" className="text-xxs">
            {` ${formatSeconds(data.duration)}`}
          </StyledText>
        </View>
      </View>
    </View>
  );
}
//#endregion

//#region Add Actions
/** Add track to a playlist or queue. */
function AddActions({ data }: { data: TrackData }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row flex-wrap gap-2">
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
        onPress={() => Queue.add(data.id, data.name)}
        Icon={<QueueMusic />}
        text={t("trackModal.queueAdd")}
      />
    </View>
  );
}
//#endregion

//#region Track Links
function TrackLinks({ data }: { data: TrackData }) {
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

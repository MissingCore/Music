import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { router, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { SheetManager, type SheetProps } from "react-native-actions-sheet";

import type { TrackWithAlbum } from "@/db/schema";
import { tracks } from "@/db/schema";
import { getTrack } from "@/db/queries";

import { List } from "@/resources/icons";
import {
  Album,
  Artist,
  Favorite,
  PlaylistAdd,
  QueueMusic,
  Schedule,
} from "@/modules/media/resources/icons";
import { useGetColumn } from "@/hooks/useGetColumn";
import { useToggleFavorite } from "@/api/favorites/[id]";
import { Queue, useMusicStore } from "@/modules/media/services/Music";

import { trackKeys } from "@/constants/QueryKeys";
import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { pickKeys } from "@/utils/object";
import { formatSeconds } from "@/utils/number";
import type { Maybe } from "@/utils/types";
import { Divider } from "@/components/new/Divider";
import { Button } from "@/components/new/Form";
import { Marquee } from "@/components/new/Marquee";
import { Sheet } from "@/components/new/Sheet";
import { StyledText } from "@/components/new/Typography";
import { ReservedPlaylists } from "@/modules/media/constants";
import { MediaImage } from "@/modules/media/components";

/** Sheet containing information and actions for a track. */
export default function TrackSheet(props: SheetProps<"track-sheet">) {
  const { isLoading, error, data } = useTrack(props.payload?.id);
  return (
    <Sheet id={props.sheetId} contentContainerClassName="gap-4">
      {isLoading || error ? null : (
        <>
          <TrackIntro data={data!} />
          <Divider />
          <AddActions data={data!} />
          <TrackLinks data={data!} />
        </>
      )}
    </Sheet>
  );
}

//#region Track Introduction
/** Contains the favorite toggle. */
function TrackIntro({ data }: { data: TrackData }) {
  const toggleFavoriteFn = useToggleFavorite({ type: "track", id: data.id });

  const isFav = toggleFavoriteFn.isPending ? !data.isFavorite : data.isFavorite;

  return (
    <View className="flex-row gap-2">
      <Pressable
        onPress={() => mutateGuard(toggleFavoriteFn, undefined)}
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
      <IconButton
        onPress={() => console.log("Opening playlist model...")}
        Icon={<PlaylistAdd />}
        text={t("playlist.add")}
      />
      <IconButton
        onPress={() => Queue.add(data.id)}
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
          <IconButton
            onPress={() => router.navigate(`/artist/${data.artistName}`)}
            Icon={<Artist />}
            text={t("common.artist")}
          />
        ) : null}
        {data.album ? (
          <IconButton
            onPress={() => router.navigate(`/album/${data.album?.id}`)}
            Icon={<Album />}
            text={t("common.album")}
          />
        ) : null}
        {canShowPlaylistBtn && isInList ? (
          <IconButton
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

//#region Icon Button
/** Clicking this button will also close the model */
function IconButton(props: {
  onPress: () => void;
  Icon: React.JSX.Element;
  text: string;
}) {
  const { width } = useGetColumn({ cols: 2, gap: 8, gutters: 32 });
  return (
    <Button
      onPress={() => {
        SheetManager.hide("track-sheet");
        props.onPress();
      }}
      style={{ width }}
      className="flex-row items-center justify-start gap-2 p-2"
    >
      {props.Icon}
      <StyledText className="shrink text-xs">{props.text}</StyledText>
    </Button>
  );
}
//#endregion

//#region Data
type TrackData = Pick<
  TrackWithAlbum,
  "id" | "name" | "artistName" | "duration" | "isFavorite"
> & { imageSource: string | null; album: { id: string; name: string } | null };

const useTrack = (trackId: Maybe<string>) =>
  useQuery({
    enabled: !!trackId,
    queryKey: trackKeys.detail(trackId!),
    queryFn: () => getTrack([eq(tracks.id, trackId!)]),
    select: (data) => ({
      ...pickKeys(data, [
        ...["id", "name", "artistName", "duration", "isFavorite"],
      ] as const),
      album: data.album ? pickKeys(data.album, ["id", "name"]) : null,
      imageSource: data.artwork,
    }),
  });
//#endregion

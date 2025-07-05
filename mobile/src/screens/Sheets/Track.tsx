import { TrueSheet } from "@lodev09/react-native-true-sheet";
import type { Href } from "expo-router";
import { router, usePathname } from "expo-router";
import type { ParseKeys } from "i18next";
import { Fragment, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import type { TrackWithAlbum } from "~/db/schema";

import { Album } from "~/icons/Album";
import { Artist } from "~/icons/Artist";
import { Edit } from "~/icons/Edit";
import { Favorite } from "~/icons/Favorite";
import { Image } from "~/icons/Image";
import { List } from "~/icons/List";
import { PlaylistAdd } from "~/icons/PlaylistAdd";
import { QueueMusic } from "~/icons/QueueMusic";
import { Schedule } from "~/icons/Schedule";
import { usePlaylists } from "~/queries/playlist";
import {
  useAddToPlaylist,
  useFavoriteTrack,
  useRemoveFromPlaylist,
  useTrack,
  useTrackPlaylists,
} from "~/queries/track";
import { useSessionStore } from "~/services/SessionStore";
import { useGetColumn } from "~/hooks/useGetColumn";
import { useTheme } from "~/hooks/useTheme";
import { TrackArtworkSheet } from "~/screens/Sheets/Artwork";
import { Queue, useMusicStore } from "~/modules/media/services/Music";

import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import {
  abbreviateBitRate,
  abbreviateSize,
  formatEpoch,
  formatSeconds,
} from "~/utils/number";
import { Card } from "~/components/Containment/Card";
import { Marquee } from "~/components/Containment/Marquee";
import { FlashList, ScrollView, useIsScrollable } from "~/components/Defaults";
import { Divider } from "~/components/Divider";
import { Button, IconButton } from "~/components/Form/Button";
import { Checkbox } from "~/components/Form/Selection";
import { Sheet, useSheetRef } from "~/components/Sheet";
import { ContentPlaceholder } from "~/components/Transition/Placeholder";
import {
  Em,
  StyledText,
  TStyledText,
} from "~/components/Typography/StyledText";
import { ReservedPlaylists } from "~/modules/media/constants";
import { MediaImage } from "~/modules/media/components/MediaImage";

//#region Track Sheet
/** Displays information about a track and enables adding it to playlists. */
export function TrackSheet() {
  const data = useSessionStore((state) => state.displayedTrack);
  const trackArtworkSheetRef = useSheetRef();
  const { handlers, isScrollable } = useIsScrollable();

  const editArtwork = useCallback(() => {
    trackArtworkSheetRef.current?.present();
  }, [trackArtworkSheetRef]);

  return (
    <>
      <Sheet
        globalKey="TrackSheet"
        // Required to get auto-resizing to work when content height changes.
        // Ref: https://github.com/lodev09/react-native-true-sheet/issues/7
        sizes={["auto", "large"]}
      >
        {data !== null ? (
          <ScrollView
            {...handlers}
            nestedScrollEnabled={isScrollable}
            contentContainerClassName="gap-4"
          >
            <TrackIntro data={data} />
            <TrackMetadata data={data} />
            <TrackActions id={data.id} editArtwork={editArtwork} />
          </ScrollView>
        ) : null}
      </Sheet>
      <TrackToPlaylistSheet key={data?.id} id={data?.id ?? ""} />
      {data !== null && (
        <TrackArtworkSheet sheetRef={trackArtworkSheetRef} id={data.id} />
      )}
    </>
  );
}

//#region Track Introduction
function TrackIntro({ data }: { data: TrackWithAlbum }) {
  const navLinks = [
    {
      href: `/album/${encodeURIComponent(data.album?.id ?? "")}` as Href,
      value: data.album?.name,
    },
    {
      href: `/artist/${encodeURIComponent(data.artistName ?? "")}` as Href,
      value: data.artistName,
    },
  ].filter(({ value }) => typeof value === "string");

  return (
    <View className="mb-2 flex-row items-end gap-3">
      <MediaImage
        type="track"
        size={64}
        source={data.artwork}
        className="rounded"
      />
      <View className="shrink py-2">
        <Marquee>
          <StyledText className="text-lg">{data.name}</StyledText>
        </Marquee>
        {navLinks.length > 0 ? (
          <Marquee>
            {navLinks.map(({ href, value }, idx) => (
              <Fragment key={idx}>
                {idx === 1 ? (
                  <StyledText className="text-xs">|</StyledText>
                ) : null}
                <Pressable onPress={sheetAction(() => router.navigate(href))}>
                  <StyledText dim className={cn({ "text-red": idx === 1 })}>
                    {value}
                  </StyledText>
                </Pressable>
              </Fragment>
            ))}
          </Marquee>
        ) : null}
      </View>
    </View>
  );
}
//#endregion

//#region Metadata
function TrackMetadata({ data }: { data: TrackWithAlbum }) {
  const { foreground, surface } = useTheme();
  return (
    <Card className="gap-4">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-1">
          <Schedule size={12} color={foreground} />
          <StyledText className="text-xxs">
            {formatSeconds(data.duration)}
          </StyledText>
        </View>
        <StyledText className="text-xxs">
          {data.bitrate !== null ? abbreviateBitRate(data.bitrate) : "—"}
        </StyledText>
        <StyledText className="text-xxs">
          {data.sampleRate !== null ? `${data.sampleRate} Hz` : "—"}
        </StyledText>
        <StyledText className="text-xxs">
          {formatEpoch(data.modificationTime)}
        </StyledText>
      </View>
      <Divider />
      <View className="flex-row items-center justify-between gap-4">
        <Marquee color={surface} wrapperClassName="shrink">
          <StyledText className="text-xxs">{data.uri}</StyledText>
        </Marquee>
        <View className="flex-row gap-2">
          {data.format ? <Badge>{data.format.toUpperCase()}</Badge> : null}
          <Badge>{abbreviateSize(data.size)}</Badge>
        </View>
      </View>
    </Card>
  );
}
//#endregion

//#region Actions
function TrackActions(props: { id: string; editArtwork: VoidFunction }) {
  const { t } = useTranslation();
  const { data } = useTrack(props.id);
  const favoriteTrack = useFavoriteTrack(props.id);

  const favStatus = data?.isFavorite ?? false;
  const isFav = favoriteTrack.isPending ? !favStatus : favStatus;

  return (
    <Card className="flex-row justify-evenly py-1">
      <IconButton
        Icon={Favorite}
        accessibilityLabel={t(`term.${isFav ? "unF" : "f"}avorite`)}
        onPress={() => mutateGuard(favoriteTrack, !favStatus)}
        filled={isFav}
      />
      <IconButton
        Icon={Edit}
        accessibilityLabel={t("feat.trackMetadata.title")}
        onPress={sheetAction(() =>
          router.push(`/track/modify?id=${encodeURIComponent(props.id)}`),
        )}
      />
      <IconButton
        Icon={Image}
        accessibilityLabel={t("feat.artwork.extra.change")}
        onPress={sheetAction(props.editArtwork)}
      />
    </Card>
  );
}
//#endregion

//#region Sheet Helpers
function Badge(props: { children: string }) {
  return (
    <View className="rounded-sm bg-onSurface px-2 py-1">
      <Em {...props} />
    </View>
  );
}

function sheetAction(onPress: VoidFunction) {
  return () => {
    TrueSheet.dismiss("TrackSheet");
    onPress();
  };
}
//#endregion
//#endregion

//#region Track To Playlist Sheet
/** Enables us to select which playlists the track belongs to. */
function TrackToPlaylistSheet({ id }: { id: string }) {
  const { canvasAlt, surface } = useTheme();
  const { data } = usePlaylists();
  const { data: inList } = useTrackPlaylists(id);
  const addToPlaylist = useAddToPlaylist(id);
  const removeFromPlaylist = useRemoveFromPlaylist(id);

  return (
    <Sheet
      globalKey="TrackToPlaylistSheet"
      titleKey="feat.modalTrack.extra.addToPlaylist"
      snapTop
    >
      <FlashList
        estimatedItemSize={58} // 54px Height + 4px Margin Top
        data={data}
        keyExtractor={({ name }) => name}
        renderItem={({ item, index }) => {
          const selected = inList?.includes(item.name) ?? false;
          return (
            <Checkbox
              selected={selected}
              onSelect={() =>
                mutateGuard(
                  // @ts-expect-error - We don't care about return type.
                  selected ? removeFromPlaylist : addToPlaylist,
                  item.name,
                )
              }
              wrapperClassName={index > 0 ? "mt-1" : undefined}
            >
              <Marquee color={selected ? surface : canvasAlt}>
                <StyledText>{item.name}</StyledText>
              </Marquee>
            </Checkbox>
          );
        }}
        ListEmptyComponent={
          <ContentPlaceholder errMsgKey="err.msg.noPlaylists" />
        }
        nestedScrollEnabled
        contentContainerClassName="pb-4"
      />
    </Sheet>
  );
}
//#endregion

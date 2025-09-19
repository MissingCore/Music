import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ParseKeys } from "i18next";
import { Fragment, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ViewStyle } from "react-native";
import { Pressable, View } from "react-native";

import type { TrackWithAlbum } from "~/db/schema";

import type { Icon } from "~/resources/icons/type";
import { Edit } from "~/resources/icons/Edit";
import { Favorite } from "~/resources/icons/Favorite";
import { Image } from "~/resources/icons/Image";
import { List } from "~/resources/icons/List";
import { PlaylistAdd } from "~/resources/icons/PlaylistAdd";
import { QueueMusic } from "~/resources/icons/QueueMusic";
import { Schedule } from "~/resources/icons/Schedule";
import { Visibility } from "~/resources/icons/Visibility";
import { VisibilityOff } from "~/resources/icons/VisibilityOff";
import { usePlaylists } from "~/queries/playlist";
import {
  useAddToPlaylist,
  useFavoriteTrack,
  useRemoveFromPlaylist,
  useHideTrack,
  useTrack,
  useTrackPlaylists,
} from "~/queries/track";
import { useSessionStore } from "~/services/SessionStore";
import { useGetColumn } from "~/hooks/useGetColumn";
import { useTheme } from "~/hooks/useTheme";
import { getMediaLinkContext } from "~/navigation/utils/router";
import { TrackArtworkSheet } from "~/screens/Sheets/Artwork";
import { Queue, useMusicStore } from "~/modules/media/services/Music";

import { Colors } from "~/constants/Styles";
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
import { StyledText, TStyledText } from "~/components/Typography/StyledText";
import { MediaImage } from "~/modules/media/components/MediaImage";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

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
            <TrackIconActions id={data.id} editArtwork={editArtwork} />
            <TrackTextActions id={data.id} name={data.name} />
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

//#region Introduction
function TrackIntro({ data }: { data: TrackWithAlbum }) {
  const [_, navigate] = useNavigationAction();

  const navLinks = [
    {
      linkInfo: ["Album", { id: data.albumId }] as const,
      value: data.album?.name,
    },
    {
      linkInfo: ["Artist", { id: data.artistName }] as const,
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
        <Marquee color="canvasAlt">
          <StyledText className="text-lg">{data.name}</StyledText>
        </Marquee>
        {navLinks.length > 0 ? (
          <Marquee color="canvasAlt">
            {navLinks.map(({ linkInfo, value }, idx) => (
              <Fragment key={idx}>
                {idx === 1 ? (
                  <StyledText className="text-xs">|</StyledText>
                ) : null}
                <Pressable onPress={sheetAction(() => navigate(...linkInfo))}>
                  <StyledText
                    dim
                    className={cn({ "text-red": linkInfo[0] === "Artist" })}
                  >
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
  const { foreground } = useTheme();
  return (
    <Card className="gap-4">
      <Marquee
        color="surface"
        contentContainerClassName="grow justify-between gap-4"
      >
        <MetadataText>
          {data.bitrate !== null ? abbreviateBitRate(data.bitrate) : "—"}
        </MetadataText>
        <MetadataText>
          {data.sampleRate !== null ? `${data.sampleRate} Hz` : "—"}
        </MetadataText>
        <MetadataText>{abbreviateSize(data.size)}</MetadataText>
        <View className="flex-row items-center gap-1">
          <Edit size={14} color={foreground} />
          <MetadataText>{formatEpoch(data.modificationTime)}</MetadataText>
        </View>
      </Marquee>
      <Divider />
      <View className="flex-row items-center justify-between gap-4">
        <Marquee color="surface">
          <MetadataText>{data.uri}</MetadataText>
        </Marquee>
        <View className="flex-row gap-2">
          {data.format ? <Badge>{data.format.toUpperCase()}</Badge> : null}
          <Badge Icon={Schedule}>{formatSeconds(data.duration)}</Badge>
        </View>
      </View>
    </Card>
  );
}
//#endregion

//#region Actions
/** Actions that can be understood with just an icon. */
function TrackIconActions(props: { id: string; editArtwork: VoidFunction }) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { data } = useTrack(props.id);
  const favoriteTrack = useFavoriteTrack(props.id);
  const hideTrack = useHideTrack();

  const favStatus = data?.isFavorite ?? false;
  const isFav = favoriteTrack.isPending ? !favStatus : favStatus;

  return (
    <Card className="flex-row justify-evenly gap-4 py-1">
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
          navigation.navigate("ModifyTrack", { id: props.id }),
        )}
      />
      <IconButton
        Icon={Image}
        accessibilityLabel={t("feat.artwork.extra.change")}
        onPress={sheetAction(props.editArtwork)}
      />
      <IconButton
        Icon={data?.hiddenAt ? VisibilityOff : Visibility}
        accessibilityLabel={t(
          `template.entry${data?.hiddenAt ? "Show" : "Hide"}`,
          { name: data?.name },
        )}
        onPress={sheetAction(() =>
          mutateGuard(hideTrack, {
            trackId: props.id,
            isHidden: !data?.hiddenAt,
          }),
        )}
      />
    </Card>
  );
}

/** Actions that require a visual description. */
function TrackTextActions({ id, name }: Record<"id" | "name", string>) {
  const [onNowPlayingScreen, navigate] = useNavigationAction();
  const { width } = useGetColumn({ cols: 2, gap: 3, gutters: 32 });
  const playingSource = useMusicStore((state) => state.playingSource);
  const sourceName = useMusicStore((state) => state.sourceName);
  const playingList = useMusicStore((state) => state.playingList);

  const showPlayingFrom =
    onNowPlayingScreen && playingList.some((tId) => tId === id);

  const listLinkInfo = useMemo(
    () => (playingSource ? getMediaLinkContext(playingSource) : undefined),
    [playingSource],
  );

  return (
    <View className="gap-[3px]">
      <View className="flex-row gap-[3px]">
        <ListButton
          Icon={PlaylistAdd}
          textKey="feat.modalTrack.extra.addToPlaylist"
          onPress={sheetAction(() => TrueSheet.present("TrackToPlaylistSheet"))}
          style={{ width }}
          className={cn("rounded-tl-md", { "rounded-bl-md": !showPlayingFrom })}
        />
        <ListButton
          Icon={QueueMusic}
          textKey="feat.modalTrack.extra.addToQueue"
          onPress={sheetAction(() => Queue.add({ id, name }))}
          style={{ width }}
          className={cn("rounded-tr-md", { "rounded-br-md": !showPlayingFrom })}
        />
      </View>
      {showPlayingFrom ? (
        <ListButton
          Icon={List}
          textKey="term.playingFrom"
          description={sourceName}
          onPress={sheetAction(() =>
            listLinkInfo ? navigate(...listLinkInfo) : undefined,
          )}
          className="grow rounded-b-md"
        />
      ) : null}
    </View>
  );
}
//#endregion

//#region Track Sheet Helpers
function Badge(props: {
  Icon?: (props: Icon) => React.JSX.Element;
  children: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      className={cn(
        "flex-row items-center gap-1 rounded-[6px] bg-neutral85 px-2 py-1",
        { "bg-neutral65": theme === "dark" },
      )}
    >
      {props.Icon ? <props.Icon size={14} color={Colors.neutral0} /> : null}
      <MetadataText className="text-neutral0">{props.children}</MetadataText>
    </View>
  );
}

function MetadataText({
  className,
  ...props
}: React.ComponentProps<typeof StyledText>) {
  return (
    <StyledText className={cn("text-xs leading-tight", className)} {...props} />
  );
}

function ListButton(props: {
  Icon: (props: Icon) => React.JSX.Element;
  onPress: VoidFunction;
  textKey: ParseKeys;
  description?: string;
  style?: ViewStyle;
  className?: string;
}) {
  return (
    <Button
      onPress={props.onPress}
      style={props.style}
      className={cn(
        "flex-1 flex-row justify-start gap-3 rounded-sm",
        props.className,
      )}
    >
      <props.Icon />
      <View className="shrink gap-0.5">
        <TStyledText textKey={props.textKey} className="text-sm" />
        {props.description ? (
          <StyledText numberOfLines={1} dim className="text-xxs">
            {props.description}
          </StyledText>
        ) : null}
      </View>
    </Button>
  );
}

function sheetAction(onPress: VoidFunction) {
  return () => {
    TrueSheet.dismiss("TrackSheet");
    onPress();
  };
}

function useNavigationAction() {
  const navigation = useNavigation();
  const currNavRoutes = useNavigationState((s) => s.routes);

  const onNowPlaying = useMemo(
    () => currNavRoutes.at(-1)?.name === "NowPlaying",
    [currNavRoutes],
  );

  return useMemo(
    () =>
      [
        onNowPlaying,
        (...args: any[]) => {
          // Call `goBack()` to mimic `popTo` since we don't have access
          // to that function in the sheet.
          if (onNowPlaying) navigation.goBack();
          // @ts-expect-error - Arguments should be compatible.
          navigation.navigate(...args);
        },
      ] as const,
    [navigation, onNowPlaying],
  );
}
//#endregion
//#endregion

//#region Track To Playlist Sheet
/** Enables us to select which playlists the track belongs to. */
function TrackToPlaylistSheet({ id }: { id: string }) {
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
              <Marquee color={selected ? "surface" : "canvasAlt"}>
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

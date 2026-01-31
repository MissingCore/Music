import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import type { TrackWithRelations } from "~/db/schema";

import type { Icon } from "~/resources/icons/type";
import { Delete } from "~/resources/icons/Delete";
import { Edit } from "~/resources/icons/Edit";
import { Favorite } from "~/resources/icons/Favorite";
import { Image } from "~/resources/icons/Image";
import { LowPriority } from "~/resources/icons/LowPriority";
import { PlaylistAdd } from "~/resources/icons/PlaylistAdd";
import { QueueMusic } from "~/resources/icons/QueueMusic";
import { Schedule } from "~/resources/icons/Schedule";
import {
  useAddToPlaylist,
  useHideTrack,
  useRemoveFromPlaylist,
  useTrackFavoriteStatus,
} from "~/queries/track";
import { Queue } from "~/stores/Playback/actions";
import { useSessionStore } from "~/services/SessionStore";

import { TrackArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import { TrackToPlaylistsSheet } from "./TrackToPlaylistsSheet";

import { mutateGuard } from "~/lib/react-query";
import {
  abbreviateBitRate,
  abbreviateSize,
  formatEpoch,
  formatSeconds,
} from "~/utils/number";
import { Divider } from "~/components/Divider";
import { IconButton } from "~/components/Form/Button/Icon";
import { Marquee } from "~/components/Marquee";
import { DetachedSheet } from "~/components/Sheet/Detached";
import { SheetButtonGroup } from "~/components/Sheet/SheetButtonGroup";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText } from "~/components/Typography/StyledText";
import { FavoritesPlaylistKey } from "~/modules/media/constants";
import { ArtistsLink } from "~/modules/media/components/ArtistsLink";
import { MediaImage } from "~/modules/media/components/MediaImage";

const GLOBAL_SHEET_KEY = "TrackSheet";

/** Displays information about a track and enables adding it to playlists. */
export function TrackSheet() {
  const data = useSessionStore((s) => s.displayedTrack);
  const trackArtworkSheetRef = useSheetRef();

  return (
    <>
      <DetachedSheet globalKey={GLOBAL_SHEET_KEY} gap={16}>
        {data !== null ? (
          <>
            <TrackIntro data={data} />
            <TrackMetadata data={data} />
            <IconActions
              data={data}
              editArtwork={() => trackArtworkSheetRef.current?.present()}
            />
            <QueueActions id={data.id} name={data.name} />
          </>
        ) : null}
      </DetachedSheet>
      <TrackToPlaylistsSheet key={data?.id} id={data?.id ?? ""} />
      {data !== null ? (
        <TrackArtworkSheet ref={trackArtworkSheetRef} id={data.id} />
      ) : null}
    </>
  );
}

//#region Introduction
function TrackIntro({ data }: { data: TrackWithRelations }) {
  const navigation = useNavigation();
  const currNavRoutes = useNavigationState((s) => s.routes);

  const onNowPlaying = useMemo(
    () => currNavRoutes.at(-1)?.name === "NowPlaying",
    [currNavRoutes],
  );

  return (
    <View className="flex-row items-end gap-2">
      <MediaImage
        type="track"
        size={64}
        source={data.artwork}
        className="rounded-sm"
      />
      <View className="shrink py-1">
        <Marquee color="surfaceBright">
          <StyledText style={{ fontSize: 18 }} className="leading-tight">
            {data.name}
          </StyledText>
        </Marquee>
        <ArtistsLink
          artistNames={data.tracksToArtists.map((rel) => rel.artistName)}
          beforeNavigation={() => TrueSheet.dismiss(GLOBAL_SHEET_KEY)}
          popScreen={onNowPlaying}
          marqueeShadowColor="surfaceBright"
        />
        {data.album ? (
          <Marquee color="surfaceBright">
            <Pressable
              onPress={sheetAction(() => {
                if (onNowPlaying) navigation.goBack();
                navigation.navigate("Album", { id: data.album!.id });
              })}
            >
              <StyledText dim>{data.album.name}</StyledText>
            </Pressable>
          </Marquee>
        ) : null}
      </View>
    </View>
  );
}
//#endregion

//#region Metadata
function TrackMetadata({ data }: { data: TrackWithRelations }) {
  return (
    <View className="gap-4 rounded-md bg-surfaceContainerLowest p-4">
      <Marquee
        color="surfaceContainerLowest"
        contentContainerClassName="grow justify-between gap-4"
      >
        <StyledText className="text-xxs/tight">
          {data.bitrate !== null ? abbreviateBitRate(data.bitrate) : "—"}
        </StyledText>
        <StyledText className="text-xxs/tight">
          {data.sampleRate !== null ? `${data.sampleRate} Hz` : "—"}
        </StyledText>
        <StyledText className="text-xxs/tight">
          {abbreviateSize(data.size)}
        </StyledText>
        <View className="flex-row items-center gap-1">
          <Edit size={14} />
          <StyledText className="text-xxs/tight">
            {formatEpoch(data.modificationTime)}
          </StyledText>
        </View>
      </Marquee>
      <Divider />
      <View className="flex-row items-center justify-between gap-4">
        <Marquee color="surfaceContainerLowest">
          <StyledText className="text-xxs/tight">{data.uri}</StyledText>
        </Marquee>
        <View className="flex-row gap-2">
          {data.format ? <Badge>{data.format.toUpperCase()}</Badge> : null}
          <Badge Icon={Schedule}>{formatSeconds(data.duration)}</Badge>
        </View>
      </View>
    </View>
  );
}
//#endregion

//#region Actions
/** Actions that can be understood with just an icon. */
function IconActions(props: {
  data: TrackWithRelations;
  editArtwork: VoidFunction;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data } = useTrackFavoriteStatus(props.data.id);
  const addToPlaylist = useAddToPlaylist(props.data.id);
  const removeFromPlaylist = useRemoveFromPlaylist(props.data.id);
  const hideTrack = useHideTrack();

  const favStatus = data ?? false;
  const isFav =
    addToPlaylist.isPending || removeFromPlaylist.isPending
      ? !favStatus
      : favStatus;

  return (
    <View className="flex-row justify-between gap-1 rounded-md bg-surfaceContainerLowest px-1">
      <IconButton
        Icon={Favorite}
        accessibilityLabel={t(`term.${isFav ? "unF" : "f"}avorite`)}
        onPress={() =>
          mutateGuard(
            // @ts-expect-error - We don't care about return type.
            isFav ? removeFromPlaylist : addToPlaylist,
            FavoritesPlaylistKey,
          )
        }
        filled={isFav}
      />
      <IconButton
        Icon={PlaylistAdd}
        accessibilityLabel={t("feat.modalTrack.extra.addToPlaylist")}
        onPress={sheetAction(() => TrueSheet.present("TrackToPlaylistsSheet"))}
      />
      <IconButton
        Icon={Edit}
        accessibilityLabel={t("feat.trackMetadata.title")}
        onPress={sheetAction(() =>
          navigation.navigate("ModifyTrack", { id: props.data.id }),
        )}
      />
      <IconButton
        Icon={Image}
        accessibilityLabel={t("feat.artwork.extra.change")}
        onPress={sheetAction(props.editArtwork)}
      />
      <IconButton
        Icon={Delete}
        accessibilityLabel={t("template.entryHide", { name: props.data.name })}
        onPress={sheetAction(() =>
          mutateGuard(hideTrack, { track: props.data }),
        )}
      />
    </View>
  );
}

/** Buttons to add the track to the queue. */
function QueueActions({ id, name }: Record<"id" | "name", string>) {
  return (
    <SheetButtonGroup
      leftButton={{
        textKey: "feat.queue.extra.playNext",
        onPress: sheetAction(() => Queue.add({ id, name })),
        LeftElement: <QueueMusic />,
      }}
      rightButton={{
        textKey: "feat.queue.extra.playLast",
        onPress: sheetAction(() => Queue.addToEnd({ id, name })),
        LeftElement: <LowPriority />,
      }}
    />
  );
}
//#endregion

//#region Track Sheet Helpers
function Badge(props: {
  Icon?: (props: Icon) => React.JSX.Element;
  children: string;
}) {
  return (
    <View className="flex-row items-center gap-1 rounded-[6px] bg-surfaceContainerHigh px-2 py-1">
      {props.Icon ? <props.Icon size={14} /> : null}
      <StyledText className="text-xxs/tight">{props.children}</StyledText>
    </View>
  );
}

/** Calls action after dismissing sheet. */
function sheetAction(onPress: VoidFunction) {
  return () => {
    TrueSheet.dismiss(GLOBAL_SHEET_KEY);
    onPress();
  };
}
//#endregion

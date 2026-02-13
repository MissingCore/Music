import { toast } from "@backpackapp-io/react-native-toast";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from "zod/mini";
import type { DragListRenderItemInfo } from "react-native-draglist/dist/FlashList";

import type { SlimTrackWithAlbum } from "~/db/slimTypes";

import i18next from "~/modules/i18n";
import { Add } from "~/resources/icons/Add";
import { Cancel } from "~/resources/icons/Cancel";
import { CheckCircle } from "~/resources/icons/CheckCircle";
import { Delete } from "~/resources/icons/Delete";
import { getArtistsString } from "~/api/artist.utils";
import { sanitizePlaylistName } from "~/api/playlist.utils";
import { TrackList, getTrackArtwork } from "~/api/track.utils";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";
import { AddMusicSheet } from "../sheets/AddMusicSheet";

import { cn } from "~/lib/style";
import { ToastOptions } from "~/lib/toast";
import { FlashDragList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button/Icon";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { TStyledText } from "~/components/Typography/StyledText";
import {
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState";
import { FormInputImpl, InputLabel } from "~/modules/form/FormState/FormInput";
import { FavoritesPlaylistKey } from "~/modules/media/constants";
import type { SearchCallbacks } from "~/modules/search/types";
import { Swipeable } from "~/components/Swipeable";
import { SearchResult } from "~/modules/search/components/SearchResult";

export function ModifyPlaylistBase(props: {
  onSubmit: (data: PlaylistEntry) => void | Promise<void>;
  mode?: "create" | "edit";
  initialData?: PlaylistEntry;
  invalidNames: string[];
}) {
  const { offset } = useFloatingContent();

  return (
    <FormStateProvider
      schema={PlaylistEntrySchema}
      initData={{
        isFavoritesList: props.initialData?.name === FavoritesPlaylistKey,
        name: props.initialData?.name ?? "",
        tracks: props.initialData?.tracks ?? [],
      }}
      onSubmit={props.onSubmit}
      onConstraints={({ name }) => {
        // Checks to see if playlist name is unique.
        let isUnique = false;
        try {
          const sanitized = sanitizePlaylistName(name);
          isUnique =
            props.initialData?.name === sanitized ||
            !props.invalidNames.includes(sanitized);
        } catch {}
        return isUnique;
      }}
    >
      <PlaylistForm bottomOffset={offset} />
    </FormStateProvider>
  );
}

//#region Playlist Form
const FormInput = FormInputImpl<PlaylistEntry>();

function PlaylistForm({ bottomOffset }: { bottomOffset: number }) {
  const { data } = useFormState();
  const addTracksSheetRef = useSheetRef();

  const removeTrack = useCallback((id: string) => {}, []);

  return (
    <>
      <AddTracksSheet ref={addTracksSheetRef} />
      <FlashDragList
        data={data.tracks}
        keyExtractor={({ id }) => id}
        renderItem={(args) => <RenderItem {...args} onRemove={removeTrack} />}
        onReordered={console.log}
        ListHeaderComponent={
          <ListHeaderComponent
            showSheet={() => addTracksSheetRef.current?.present()}
          />
        }
        ListEmptyComponent={<View></View>}
        contentContainerStyle={{ paddingBottom: bottomOffset }}
        contentContainerClassName="p-4"
      />
    </>
  );
}

//#region Add Tracks Sheet
function AddTracksSheet(props: { ref: TrueSheetRef }) {
  const { setField } = useFormState();

  const searchCallbacks: Pick<SearchCallbacks, "album" | "folder" | "track"> =
    useMemo(
      () => ({
        album: ({ tracks, ...album }) => {
          setField((prev) => ({
            ...prev,
            tracks: TrackList.merge(
              prev.tracks,
              (tracks as SlimTrackWithAlbum[]).map(formatTrack),
            ),
          }));
          toast(
            i18next.t("template.entryAdded", { name: album.name }),
            ToastOptions,
          );
        },
        folder: ({ name, tracks }) => {
          setField((prev) => ({
            ...prev,
            tracks: TrackList.merge(prev.tracks, tracks.map(formatTrack)),
          }));
          toast(i18next.t("template.entryAdded", { name }), ToastOptions);
        },
        track: (track) => {
          setField((prev) => ({
            ...prev,
            tracks: prev.tracks
              .filter(({ id }) => track.id !== id)
              .concat(formatTrack(track)),
          }));
          toast(
            i18next.t("template.entryAdded", { name: track.name }),
            ToastOptions,
          );
        },
      }),
      [setField],
    );

  return <AddMusicSheet ref={props.ref} callbacks={searchCallbacks} />;
}

function formatTrack(t: SlimTrackWithAlbum) {
  return {
    id: t.id,
    name: t.name,
    artists: getArtistsString(t.tracksToArtists),
    artwork: getTrackArtwork(t),
  };
}
//#endregion

//#region Playlist Name Field
function PlaylistNameField() {
  const {
    data: { isFavoritesList },
    passedConstraints,
  } = useFormState();

  const ConstraintIcon = useMemo(
    () => (passedConstraints ? CheckCircle : Cancel),
    [passedConstraints],
  );
  const constraintColor = !passedConstraints ? "onSurfaceVariant" : undefined;

  return (
    <View className="gap-1">
      {isFavoritesList ? (
        <View className="h-8 w-full justify-center rounded-sm border border-outline p-2 opacity-25">
          <TStyledText textKey="term.favoriteTracks" numberOfLines={1} />
        </View>
      ) : (
        <FormInput labelKey="feat.trackMetadata.extra.name" field="name" />
      )}
      <View className="shrink flex-row items-center gap-0.5">
        <ConstraintIcon size={16} color={constraintColor} />
        <TStyledText
          textKey="form.validation.unique"
          className={cn("text-xs", constraintColor)}
        />
      </View>
    </View>
  );
}
//#endregion

//#region Pre-DragList Fields
function ListHeaderComponent(props: { showSheet: VoidFunction }) {
  const { t } = useTranslation();
  const { isSubmitting } = useFormState();

  return (
    <View className="gap-6">
      <PlaylistNameField />
      <InputLabel
        labelKey="term.tracks"
        RightElement={
          <IconButton
            Icon={Add}
            accessibilityLabel={t("template.entryAdd", {
              name: t("term.track"),
            })}
            onPress={props.showSheet}
            disabled={isSubmitting}
            size="xs"
          />
        }
      />
    </View>
  );
}
//#endregion

//#region Rendered Item
type RenderItemProps = DragListRenderItemInfo<PlaylistEntry["tracks"][number]>;

/** @deprecated VERY TEMPORARY */
const RenderItem = memo(function RenderItem({
  item,
  onRemove,
  ...info
}: RenderItemProps & { onRemove: (id: string) => void }) {
  return (
    <Swipeable
      disabled={info.isDragging}
      onSwipeLeft={() => onRemove(item.id)}
      RightIcon={<Delete color="onError" />}
      rightIconContainerClassName="rounded-xs bg-error"
      wrapperClassName="mx-4 mb-2"
      className="overflow-hidden rounded-xs bg-surface"
    >
      <SearchResult
        button
        type="track"
        title={item.name}
        description={item.artists}
        imageSource={item.artwork}
        delayLongPress={250}
        onLongPress={info.onDragStart}
        onPressOut={info.onDragEnd}
        className={cn("pr-4", {
          // The `active:` variant is to override the default active style
          // as `!important` isn't enough to change the background color
          // (it'll only change to `bg-surfaceContainerLowest ` one we drag the item).
          "bg-surfaceContainerLowest active:bg-surfaceContainerLowest":
            info.isActive,
        })}
      />
    </Swipeable>
  );
});
//#endregion
//#endregion

//#region Schema
const NullableString = z.nullable(z.string());
const NonEmptyStringSchema = z.string().check(z.trim(), z.minLength(1));

const SlimTrackSchema = z.object({
  id: NonEmptyStringSchema,
  name: NonEmptyStringSchema,
  artists: NonEmptyStringSchema,
  artwork: NullableString,
});

const PlaylistEntrySchema = z.object({
  // Additional context:
  isFavoritesList: z.boolean(),
  // Actual form fields:
  name: NonEmptyStringSchema,
  tracks: z.array(SlimTrackSchema),
});

type PlaylistEntry = z.infer<typeof PlaylistEntrySchema>;

function useFormState() {
  return useFormStateContext<PlaylistEntry>();
}
//#endregion

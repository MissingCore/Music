import { toast } from "@backpackapp-io/react-native-toast";
import { useNavigation } from "@react-navigation/native";
import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { DragListRenderItemInfo } from "react-native-draglist/dist/FlashList";
import { z } from "zod/mini";

import type { SlimTrackWithAlbum } from "~/db/slimTypes";

import i18next from "~/modules/i18n";
import { Add } from "~/resources/icons/Add";
import { Cancel } from "~/resources/icons/Cancel";
import { CheckCircle } from "~/resources/icons/CheckCircle";
import { DoNotDisturbOn } from "~/resources/icons/DoNotDisturbOn";
import { DragHandle } from "~/resources/icons/DragHandle";
import { getArtistsString } from "~/api/artist.utils";
import { useDeletePlaylist } from "~/queries/playlist";
import { sanitizePlaylistName } from "~/api/playlist.utils";
import { TrackList, getTrackArtwork } from "~/api/track.utils";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { AddMusicSheet } from "../sheets/AddMusicSheet";

import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { ToastOptions } from "~/lib/toast";
import { moveArray } from "~/utils/object";
import { wait } from "~/utils/promise";
import { FlashDragList } from "~/components/Defaults";
import { ExtendedTButton } from "~/components/Form/Button";
import { IconButton } from "~/components/Form/Button/Icon";
import { ModalTemplate } from "~/components/Modal";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { TStyledText } from "~/components/Typography/StyledText";
import { readM3UPlaylist } from "~/modules/backup/M3U";
import { ZSchema } from "~/modules/form/utils";
import {
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState";
import { FormInputImpl, InputLabel } from "~/modules/form/FormState/FormInput";
import { FavoritesPlaylistKey } from "~/modules/media/constants";
import { MediaImage } from "~/modules/media/components/MediaImage";
import { SearchResult } from "~/modules/search/components/SearchResult";
import type { SearchCallbacks } from "~/modules/search/types";

export function ModifyPlaylistBase(props: {
  onSubmit: (data: PlaylistEntry) => void | Promise<void>;
  mode?: "create" | "edit";
  initialData?: Omit<PlaylistEntry, "trackIds">;
  usedNames: string[];
}) {
  const { offset, ...rest } = useFloatingContent();

  const RenderedWorkflow = useMemo(
    () => (props.mode === "edit" ? DeleteWorkflow : ImportM3UWorkflow),
    [props.mode],
  );

  // Exclude `FavoritesPlaylistKey` as we don't return it when fetching all
  // playlists & don't check it in `sanitizePlaylistName`.
  const usedNames = useMemo(
    () => [...props.usedNames, FavoritesPlaylistKey],
    [props.usedNames],
  );

  return (
    <FormStateProvider
      schema={PlaylistEntrySchema}
      initData={{
        isFavoritesList: props.initialData?.name === FavoritesPlaylistKey,
        name: props.initialData?.name ?? "",
        tracks: props.initialData?.tracks ?? [],
        trackIds: props.initialData?.tracks.map((t) => t.id) ?? [],
      }}
      omittedFields={["isFavoritesList", "tracks"]}
      onSubmit={props.onSubmit}
      onConstraints={({ name }) => {
        // Checks to see if playlist name is unique.
        let isUnique = false;
        try {
          const sanitized = sanitizePlaylistName(name);
          isUnique =
            props.initialData?.name === sanitized ||
            !usedNames.includes(sanitized);
        } catch {}
        return isUnique;
      }}
    >
      <PlaylistForm bottomOffset={offset} />
      <RenderedWorkflow {...rest} />
    </FormStateProvider>
  );
}

//#region Playlist Form
const FormInput = FormInputImpl<PlaylistEntry>();

function PlaylistForm({ bottomOffset }: { bottomOffset: number }) {
  const { data, setFields, isSubmitting } = useFormState();
  const addTracksSheetRef = useSheetRef();

  const removeTrack = useCallback(
    (id: string) =>
      setFields((prev) =>
        getTracksFields(prev.tracks.filter((t) => t.id !== id)),
      ),
    [setFields],
  );

  const reorderTrack = useCallback(
    (fromIndex: number, toIndex: number) =>
      setFields((prev) =>
        getTracksFields(moveArray(prev.tracks, { fromIndex, toIndex })),
      ),
    [setFields],
  );

  return (
    <>
      <AddTracksSheet ref={addTracksSheetRef} />
      <View
        pointerEvents={isSubmitting ? "none" : "auto"}
        needsOffscreenAlphaCompositing
        className={cn("flex-1", { "opacity-25": isSubmitting })}
      >
        <FlashDragList
          data={data.tracks}
          keyExtractor={({ id }) => id}
          renderItem={(args) => <RenderItem {...args} onRemove={removeTrack} />}
          onReordered={reorderTrack}
          ListHeaderComponent={
            <ListHeaderComponent
              showSheet={() => addTracksSheetRef.current?.present()}
            />
          }
          ListEmptyComponent={
            <ContentPlaceholder errMsgKey="err.msg.noTracks" />
          }
          // FIXME: For some weird reason, we get double the margin bottom (should be `-mb-2`).
          className="-mb-1"
          contentContainerStyle={{ paddingBottom: bottomOffset }}
          contentContainerClassName="p-4"
        />
      </View>
    </>
  );
}

//#region Add Tracks Sheet
function AddTracksSheet(props: { ref: TrueSheetRef }) {
  const { setFields } = useFormState();

  const searchCallbacks: Pick<SearchCallbacks, "album" | "folder" | "track"> =
    useMemo(
      () => ({
        album: ({ tracks, ...album }) => {
          setFields((prev) =>
            getTracksFields(
              TrackList.merge(
                prev.tracks,
                (tracks as SlimTrackWithAlbum[]).map((t) =>
                  formatTrackForForm({ ...t, album }),
                ),
              ),
            ),
          );
          toast(
            i18next.t("template.entryAdded", { name: album.name }),
            ToastOptions,
          );
        },
        folder: ({ name, tracks }) => {
          setFields((prev) =>
            getTracksFields(
              TrackList.merge(prev.tracks, tracks.map(formatTrackForForm)),
            ),
          );
          toast(i18next.t("template.entryAdded", { name }), ToastOptions);
        },
        track: (track) => {
          setFields((prev) =>
            getTracksFields(
              prev.tracks
                .filter(({ id }) => track.id !== id)
                .concat(formatTrackForForm(track)),
            ),
          );
          toast(
            i18next.t("template.entryAdded", { name: track.name }),
            ToastOptions,
          );
        },
      }),
      [setFields],
    );

  return <AddMusicSheet ref={props.ref} callbacks={searchCallbacks} />;
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
        <View>
          <InputLabel labelKey="feat.trackMetadata.extra.name" />
          <View className="min-h-12 w-full justify-center rounded-sm border border-outline p-2 opacity-25">
            <TStyledText textKey="term.favoriteTracks" numberOfLines={1} />
          </View>
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
type RenderItemProps = DragListRenderItemInfo<SlimTrackEntry>;

const RenderItem = memo(
  function RenderItem({
    item,
    onRemove,
    ...info
  }: RenderItemProps & { onRemove: (id: string) => void }) {
    const { t } = useTranslation();
    return (
      <SearchResult
        type="track"
        title={item.name}
        description={item.artists}
        imageSource={item.artwork}
        LeftElement={
          <View className="flex-row items-center gap-1">
            <IconButton
              Icon={DoNotDisturbOn}
              accessibilityLabel={t("template.entryRemove", {
                name: item.name,
              })}
              onPress={() => onRemove(item.id)}
              disabled={info.isDragging}
              size="xs"
            />
            <MediaImage
              type="track"
              size={48}
              source={item.artwork}
              className="rounded-xs"
            />
          </View>
        }
        RightElement={
          <IconButton
            Icon={DragHandle}
            accessibilityLabel={t("template.entryMove", { name: item.name })}
            onPressIn={info.onDragStart}
            onPressOut={info.onDragEnd}
            size="xs"
          />
        }
        //! `bg-surface` is there to prevent collapsing the View.
        className={cn("mb-2 bg-surface pr-0", {
          "bg-surfaceContainerLowest": info.isActive,
        })}
      />
    );
  },
  (oldProps, newProps) => {
    return (
      oldProps.item.id === newProps.item.id &&
      (["index", "isActive", "isDragging"] as const).every(
        (k) => oldProps[k] === newProps[k],
      )
    );
  },
);
//#endregion
//#endregion

//#region Import M3U Workflow
function ImportM3UWorkflow({
  floatingRef,
  wrapperStyling,
}: Omit<ReturnType<typeof useFloatingContent>, "offset">) {
  const { t } = useTranslation();
  const { data, setFields, isSubmitting, setIsSubmitting } = useFormState();

  const onImport = async () => {
    setIsSubmitting(true);
    try {
      const { name, tracks: playlistTracks } = await readM3UPlaylist();
      toast(t("feat.backup.extra.importSuccess"), ToastOptions);
      const updatedFields: Partial<PlaylistEntry> = getTracksFields(
        playlistTracks.map(formatTrackForForm),
      );
      if (!data.name && !!name) updatedFields.name = name;
      setFields(updatedFields);
    } catch (err) {
      toast.error((err as Error).message, ToastOptions);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View ref={floatingRef} {...wrapperStyling}>
      <ExtendedTButton
        textKey="feat.playlist.extra.m3uImport"
        onPress={onImport}
        disabled={isSubmitting}
        className="bg-secondary active:bg-secondaryDim"
        textClassName="text-onSecondary"
      />
    </View>
  );
}
//#endregion

//#region Delete Workflow
function DeleteWorkflow({
  floatingRef,
  wrapperStyling,
}: Omit<ReturnType<typeof useFloatingContent>, "offset">) {
  const navigation = useNavigation();
  const [lastChance, setLastChance] = useState(false);
  const { data, isSubmitting, setIsSubmitting } = useFormState();
  const deletePlaylist = useDeletePlaylist(data.name);

  const onDelete = async () => {
    setLastChance(false);
    setIsSubmitting(true);
    // Slight buffer before running mutation.
    await wait(1);
    mutateGuard(deletePlaylist, undefined, {
      onSuccess: () => {
        navigation.goBack();
        navigation.goBack();
      },
    });
  };

  return (
    <>
      <View ref={floatingRef} {...wrapperStyling}>
        <ExtendedTButton
          textKey="form.delete"
          onPress={() => setLastChance(true)}
          disabled={lastChance || isSubmitting}
          className="bg-error active:bg-errorDim"
          textClassName="text-onError"
        />
      </View>
      <ModalTemplate
        visible={lastChance}
        titleKey="form.delete"
        topAction={{
          textKey: "form.confirm",
          onPress: onDelete,
        }}
        bottomAction={{
          textKey: "form.cancel",
          onPress: () => setLastChance(false),
        }}
      />
    </>
  );
}
//#endregion

//#region Schema
const SlimTrackSchema = z.object({
  id: ZSchema.NonEmptyString,
  name: ZSchema.NonEmptyString,
  artists: ZSchema.NonEmptyString,
  artwork: ZSchema.NullableString,
});

const PlaylistNameSchema = z.pipe(
  ZSchema.NonEmptyString,
  z.transform((str, ctx) => {
    try {
      return sanitizePlaylistName(str);
    } catch (err) {
      ctx.issues.push({
        code: "invalid_value",
        input: str,
        values: [str],
        message: (err as Error).message,
      });
      return z.NEVER;
    }
  }),
);

const PlaylistEntrySchema = z.object({
  // Additional context:
  isFavoritesList: z.boolean(),
  // Actual form fields:
  name: PlaylistNameSchema,
  tracks: z.array(SlimTrackSchema),
  //? Field derived from `tracks`.
  trackIds: z.array(ZSchema.NonEmptyString),
});

type PlaylistEntry = z.infer<typeof PlaylistEntrySchema>;
type SlimTrackEntry = z.infer<typeof SlimTrackSchema>;

function useFormState() {
  return useFormStateContext<PlaylistEntry>();
}
//#endregion

//#region Utils
export function formatTrackForForm(t: SlimTrackWithAlbum) {
  return {
    id: t.id,
    name: t.name,
    artists: getArtistsString(t.tracksToArtists),
    artwork: getTrackArtwork(t),
  };
}

/** Return `tracks` & the derived `trackIds` field. */
function getTracksFields(tracks: SlimTrackEntry[]) {
  return { tracks, trackIds: tracks.map((t) => t.id) };
}
//#endregion

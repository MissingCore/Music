// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { DragListRenderItemInfo } from "@missingcore/ui/drag-list";
import { DragList, useDragListState } from "@missingcore/ui/drag-list";
import { toast } from "@missingcore/ui/toast";
import { createContext, memo, use, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import * as v from "valibot";

import { getArtistsString } from "~/data/artist/utils";
import { usePlaylistsNames } from "~/data/playlist/queries";
import { sanitizePlaylistName } from "~/data/playlist/utils";
import type { CommonTrack } from "~/data/types";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { AddMusicSheet } from "../sheets/AddMusicSheet";

import { cn } from "~/lib/style";
import { moveArray } from "~/utils/object";
import { IconButton } from "~/components/next/base/button-icon";
import { Icon } from "~/components/next/base/icon";
import type { SheetRef } from "~/components/next/base/sheet";
import { useSheetRef } from "~/components/next/base/sheet";
import { TText } from "~/components/next/base/typography";
import { ToolbarScreenOffset } from "~/components/next/composed/toolbar";
import { ImageListItem } from "~/components/next/composed/image-list-item";
import { FormSchema } from "~/modules/form/utils";
import type { FormActionConfig } from "~/modules/form/Form";
import { Form, useFormAction, useFormContext } from "~/modules/form/Form";
import { InputLabel, createTypedFormInputs } from "~/modules/form/FormInput";
import { FavoritesPlaylistKey } from "~/modules/media/constants";
import { useAllMedia } from "~/modules/search/hooks/useSearch";
import type { SearchCallbacks } from "~/modules/search/types";

export function ModifyPlaylistBase(props: {
  onSubmit: (data: PlaylistEntry) => void | Promise<void>;
  initialData?: PlaylistEntry;
  referenceData: ReturnType<typeof usePreloadReferenceData>["data"];
  actionConfig?: FormActionConfig<PlaylistEntry>;
}) {
  // Exclude `FavoritesPlaylistKey` as we don't return it when fetching all
  // playlists & don't check it in `sanitizePlaylistName`.
  const usedNames = useMemo(
    () =>
      new Set([...props.referenceData.playlistNames!, FavoritesPlaylistKey]),
    [props.referenceData.playlistNames],
  );

  const trackMap = useMemo(
    () =>
      Object.fromEntries(props.referenceData.allTracks!.map((t) => [t.id, t])),
    [props.referenceData.allTracks],
  );

  return (
    <CachedTracksContext value={trackMap}>
      <Form.Provider
        type={Boolean(props.initialData) ? "edit" : "create"}
        schema={PlaylistEntrySchema}
        initData={{
          name: props.initialData?.name ?? "",
          trackIds: props.initialData?.trackIds ?? [],
        }}
        onSubmit={props.onSubmit}
        onConstraints={({ name }) => {
          // Checks to see if playlist name is unique.
          let isUnique = false;
          try {
            const sanitized = sanitizePlaylistName(name);
            isUnique =
              props.initialData?.name === sanitized ||
              !usedNames.has(sanitized);
          } catch {}
          return isUnique;
        }}
      >
        <PlaylistFormToolbar actionConfig={props.actionConfig} />
        <FormContents
          //? `actionConfig` being undefined implies that this is the Favorites
          //? playlist as we don't want users to delete it.
          isFavoritesList={props.actionConfig === undefined}
        />
      </Form.Provider>
    </CachedTracksContext>
  );
}

//#region Toolbar
function PlaylistFormToolbar(props: {
  actionConfig?: FormActionConfig<PlaylistEntry>;
}) {
  const FormAction = useFormAction(props.actionConfig);
  return <Form.Toolbar>{FormAction}</Form.Toolbar>;
}
//#endregion

//#region Playlist Form
const FormInput = createTypedFormInputs<PlaylistEntry>();

function FormContents({ isFavoritesList }: { isFavoritesList?: boolean }) {
  const {
    data: { trackIds },
    setFields,
    isSubmitting,
  } = useForm();
  const addTracksSheetRef = useSheetRef();

  const removeTrack = useCallback(
    (id: string) =>
      setFields((prev) => ({
        trackIds: prev.trackIds.filter((tId) => tId !== id),
      })),
    [setFields],
  );

  const reorderTrack = useCallback(
    (fromIndex: number, toIndex: number) =>
      setFields((prev) => ({
        trackIds: moveArray(prev.trackIds, { fromIndex, toIndex }),
      })),
    [setFields],
  );

  //#region Stable Callbacks
  const keyExtractor = useCallback((tId: string) => tId, []);

  const renderItem = useCallback(
    (args: DragListRenderItemInfo<string>) => (
      <RenderItem
        {...args}
        isSubmitting={isSubmitting}
        onRemove={removeTrack}
      />
    ),
    [removeTrack, isSubmitting],
  );
  //#endregion

  return (
    <>
      <AddTracksSheet ref={addTracksSheetRef} />
      <DragList
        pointerEvents={isSubmitting ? "none" : "auto"}
        estimatedItemSize={62} // 56px Height + 6px Margin Bottom
        data={trackIds}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onReordered={reorderTrack}
        extraData={{ isSubmitting }}
        ListHeaderComponent={
          <ListHeaderComponent
            isFavoritesList={isFavoritesList}
            showSheet={() => addTracksSheetRef.current?.present()}
          />
        }
        ListEmptyComponent={<ContentPlaceholder errMsgKey="err.msg.noTracks" />}
        className="-mb-1.5"
        contentContainerClassName={cn("p-4", ToolbarScreenOffset)}
      />
    </>
  );
}

//#region Add Tracks Sheet
function AddTracksSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const { setFields } = useForm();

  const searchCallbacks: Pick<SearchCallbacks, "album" | "folder" | "track"> =
    useMemo(
      () => ({
        album: ({ tracks, ...album }) => {
          setFields((prev) => ({
            trackIds: mergeStringArrays(
              prev.trackIds,
              tracks.map((t) => t.id),
            ),
          }));
          toast(t("template.entryAdded", { name: album.name }));
        },
        folder: ({ name, tracks }) => {
          setFields((prev) => ({
            trackIds: mergeStringArrays(
              prev.trackIds,
              tracks.map((t) => t.id),
            ),
          }));
          toast(t("template.entryAdded", { name }));
        },
        track: (track) => {
          setFields((prev) => ({
            trackIds: prev.trackIds
              .filter((tId) => track.id !== tId)
              .concat(track.id),
          }));
          toast(t("template.entryAdded", { name: track.name }));
        },
      }),
      [t, setFields],
    );

  return <AddMusicSheet ref={props.ref} callbacks={searchCallbacks} />;
}
//#endregion

//#region Playlist Name Field
function PlaylistNameField({ isFavoritesList }: { isFavoritesList?: boolean }) {
  const { passedConstraints } = useForm();

  const constraintColor = !passedConstraints ? "onSurfaceVariant" : undefined;

  return (
    <View className="gap-1">
      {isFavoritesList ? (
        <View>
          <InputLabel label="feat.trackMetadata.extra.name" />
          <View className="min-h-12 w-full justify-center rounded-lg border border-outline p-2 opacity-25">
            <TText textKey="term.favoriteTracks" numberOfLines={1} />
          </View>
        </View>
      ) : (
        <FormInput.Text label="feat.trackMetadata.extra.name" field="name" />
      )}
      <View className="shrink flex-row items-center gap-0.5">
        <Icon
          name={passedConstraints ? "check-circle" : "cancel"}
          size={16}
          color={constraintColor}
        />
        <TText
          textKey="form.validation.unique"
          size="xs"
          className={constraintColor}
        />
      </View>
    </View>
  );
}
//#endregion

//#region Pre-DragList Fields
function ListHeaderComponent(props: {
  isFavoritesList?: boolean;
  showSheet: VoidFunction;
}) {
  const { t } = useTranslation();
  const { isSubmitting } = useForm();

  return (
    <View className="gap-6">
      <Form.Title />
      <PlaylistNameField isFavoritesList={props.isFavoritesList} />
      <InputLabel
        label="term.tracks"
        Trailing={
          <IconButton
            icon="add"
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
type RenderItemProps = DragListRenderItemInfo<string> & {
  isSubmitting: boolean;
  onRemove: (id: string) => void;
};

const RenderItem = memo(
  function RenderItem({
    item,
    index,
    isSubmitting,
    onRemove,
  }: RenderItemProps) {
    const { t } = useTranslation();
    const { isActive, isDragging, onInitDrag } = useDragListState(index);
    const track = useCachedTrack(item);

    return (
      <ImageListItem
        src={track.artwork}
        label={track.name}
        supporting={getArtistsString(track.artists)}
        Leading={
          <IconButton
            icon="do-not-disturb-on"
            accessibilityLabel={t("template.entryRemove", { name: track.name })}
            onPress={() => onRemove(track.id)}
            disabled={isDragging}
            size="xs"
          />
        }
        Trailing={
          <IconButton
            icon="drag-handle"
            accessibilityLabel={t("template.entryMove", { name: track.name })}
            onPressIn={onInitDrag}
            disabled={isDragging && !isActive}
            size="xs"
          />
        }
        spacing="row"
        //! `bg-surface` is there to prevent collapsing this View.
        className={cn("bg-surface pr-0", {
          "bg-surfaceContainerLowest": isActive,
          "opacity-25": isSubmitting,
        })}
      />
    );
  },
  (oldProps, newProps) => {
    return (
      oldProps.item === newProps.item &&
      oldProps.index === newProps.index &&
      oldProps.isSubmitting === newProps.isSubmitting
    );
  },
);
//#endregion
//#endregion

//#region Schema
const PlaylistNameSchema = v.pipe(
  FormSchema.NonEmptyString,
  v.check((str) => {
    try {
      sanitizePlaylistName(str);
      return true;
    } catch {
      return false;
    }
  }, "Invalid playlist name."),
  v.transform(sanitizePlaylistName),
);

const PlaylistEntrySchema = v.object({
  name: PlaylistNameSchema,
  trackIds: v.array(FormSchema.NonEmptyString),
});

type PlaylistEntry = v.InferOutput<typeof PlaylistEntrySchema>;

function useForm() {
  return useFormContext<PlaylistEntry>();
}
//#endregion

//#region Utils
export function usePreloadReferenceData() {
  const playlistNamesQuery = usePlaylistsNames();
  const allMediaQuery = useAllMedia();

  return {
    isPending: playlistNamesQuery.isPending || allMediaQuery.isPending,
    isRefetching: playlistNamesQuery.isRefetching || allMediaQuery.isRefetching,
    error: playlistNamesQuery.error || allMediaQuery.error,
    data: {
      playlistNames: playlistNamesQuery.data,
      allTracks: allMediaQuery.data?.track,
    },
  };
}

const CachedTracksContext = createContext<Record<string, CommonTrack>>({});
function useCachedTrack(trackId: string) {
  const context = use(CachedTracksContext);
  return useMemo(() => context[trackId]!, [context, trackId]);
}

function mergeStringArrays(arr1: string[], arr2: string[]) {
  const incomingStrs = new Set(arr2);
  return arr1.filter((str) => !incomingStrs.has(str)).concat(arr2);
}
//#endregion

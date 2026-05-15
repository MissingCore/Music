import { toast } from "@missingcore/toast";
import { createContext, memo, use, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from "zod/mini";

import { Add } from "~/resources/icons/Add";
import { Cancel } from "~/resources/icons/Cancel";
import { CheckCircle } from "~/resources/icons/CheckCircle";
import { DragHandle } from "~/resources/icons/DragHandle";
import { getArtistsString } from "~/data/artist/utils";
import { usePlaylistsNames } from "~/data/playlist/queries";
import { sanitizePlaylistName } from "~/data/playlist/utils";
import type { CommonTrack } from "~/data/types";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { AddMusicSheet } from "../sheets/AddMusicSheet";

import { cn } from "~/lib/style";
import { moveArray } from "~/utils/object";
import {
  DragList,
  useDragListState,
  useInitDrag,
} from "~/components/Base/DragList";
import type { ListRenderItemInfo } from "~/components/Base/List";
import { IconButton } from "~/components/Form/Button/Icon";
import { RemovableItem } from "~/components/List/RemovableItem";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { TStyledText } from "~/components/Typography/StyledText";
import { ZSchema } from "~/modules/form/utils";
import type { FABWorkflowConfig } from "~/modules/form/FormState";
import {
  FABWorkflow,
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState";
import { FormInputImpl, InputLabel } from "~/modules/form/FormState/FormInput";
import { FavoritesPlaylistKey } from "~/modules/media/constants";
import { SearchResult } from "~/modules/search/components/SearchResult";
import { useAllMedia } from "~/modules/search/hooks/useSearch";
import type { SearchCallbacks } from "~/modules/search/types";

export function ModifyPlaylistBase(props: {
  onSubmit: (data: PlaylistEntry) => void | Promise<void>;
  initialData?: PlaylistEntry;
  referenceData: ReturnType<typeof usePreloadReferenceData>["data"];
  actionConfig?: FABWorkflowConfig<PlaylistEntry>;
}) {
  const { offset, floatingContentProps } = useFloatingContent();

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
      <FormStateProvider
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
        <PlaylistForm
          bottomOffset={offset}
          //? `actionConfig` being undefined implies that this is the Favorites
          //? playlist as we don't want users to delete it.
          isFavoritesList={props.actionConfig === undefined}
        />
        {props.actionConfig ? (
          <FABWorkflow
            {...props.actionConfig}
            floatingContentProps={floatingContentProps}
          />
        ) : null}
      </FormStateProvider>
    </CachedTracksContext>
  );
}

//#region Playlist Form
const FormInput = FormInputImpl<PlaylistEntry>();

function PlaylistForm(props: {
  bottomOffset: number;
  isFavoritesList?: boolean;
}) {
  const {
    data: { trackIds },
    setFields,
    isSubmitting,
  } = useFormState();
  const addTracksSheetRef = useSheetRef();

  const removeTrack = useCallback(
    (id: string) =>
      setFields((prev) => ({
        trackIds: prev.trackIds.filter((tId) => tId !== id),
      })),
    [setFields],
  );

  const reorderTrack = useCallback(
    ({ from: fromIndex, to: toIndex }: { from: number; to: number }) =>
      setFields((prev) => ({
        trackIds: moveArray(prev.trackIds, { fromIndex, toIndex }),
      })),
    [setFields],
  );

  //#region Stable Callbacks
  const keyExtractor = useCallback((tId: string) => tId, []);

  const renderItem = useCallback(
    (args: ListRenderItemInfo<string>) => (
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
        data={trackIds}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onReorder={reorderTrack}
        ListHeaderComponent={
          <ListHeaderComponent
            isFavoritesList={props.isFavoritesList}
            showSheet={() => addTracksSheetRef.current?.present()}
          />
        }
        ListEmptyComponent={<ContentPlaceholder errMsgKey="err.msg.noTracks" />}
        contentContainerStyle={{ paddingBottom: props.bottomOffset }}
        contentContainerClassName="px-4"
      />
    </>
  );
}

//#region Add Tracks Sheet
function AddTracksSheet(props: { ref: TrueSheetRef }) {
  const { t } = useTranslation();
  const { setFields } = useFormState();

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
  const { passedConstraints } = useFormState();

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
function ListHeaderComponent(props: {
  isFavoritesList?: boolean;
  showSheet: VoidFunction;
}) {
  const { t } = useTranslation();
  const { isSubmitting } = useFormState();

  return (
    <View className="gap-6">
      <PlaylistNameField isFavoritesList={props.isFavoritesList} />
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
type RenderItemProps = ListRenderItemInfo<string> & {
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
    const initDrag = useInitDrag();
    const { isActive, isDragging } = useDragListState(index);
    const track = useCachedTrack(item);

    return (
      <RemovableItem
        label={track.name}
        onRemove={() => onRemove(track.id)}
        disableRemove={isDragging}
        //! `bg-surface` is there to prevent collapsing the View.
        className={cn("mb-2 rounded-xs bg-surface", {
          "bg-surfaceContainerLowest": isActive,
          "opacity-25": isSubmitting,
        })}
      >
        <SearchResult
          type="track"
          title={track.name}
          description={getArtistsString(track.artists)}
          imageSource={track.artwork}
          RightElement={
            <IconButton
              Icon={DragHandle}
              accessibilityLabel={t("template.entryMove", { name: track.name })}
              onPressIn={initDrag}
              disabled={isDragging && !isActive}
              size="xs"
            />
          }
          className="shrink grow"
        />
      </RemovableItem>
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
  name: PlaylistNameSchema,
  trackIds: z.array(ZSchema.NonEmptyString),
});

type PlaylistEntry = z.infer<typeof PlaylistEntrySchema>;

function useFormState() {
  return useFormStateContext<PlaylistEntry>();
}
//#endregion

//#region Utils
export function usePreloadReferenceData() {
  const playlistNamesQuery = usePlaylistsNames();
  const allMediaQuery = useAllMedia();

  return {
    isPending: playlistNamesQuery.isPending || allMediaQuery.isPending,
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

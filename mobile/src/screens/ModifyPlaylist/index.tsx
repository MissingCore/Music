import { Stack, router } from "expo-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Modal, Pressable, View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import type { DragListRenderItemInfo } from "react-native-draglist";
import DragList from "react-native-draglist";

import type { TrackWithAlbum } from "@/db/schema";

import { Add, Cancel, CheckCircle, Check, Remove } from "@/icons";
import { useDeletePlaylist } from "@/queries/playlist";
import type { InitStoreProps } from "./context";
import { PlaylistStoreProvider, usePlaylistStore } from "./context";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { pickKeys } from "@/utils/object";
import { wait } from "@/utils/promise";
import { useListPresets } from "@/components/Defaults";
import { IconButton, TextInput } from "@/components/Form";
import type { SwipeableRef } from "@/components/Swipeable";
import { Swipeable } from "@/components/Swipeable";
import { StyledText, TStyledText } from "@/components/Typography";
import { SearchResult } from "@/modules/search/components";

/** Resuable screen to modify (create or edit) a playlist. */
export function ModifyPlaylist(props: InitStoreProps) {
  return (
    <PlaylistStoreProvider {...props}>
      <ScreenConfig />
      <PageContent />
      <DeleteWorkflow />
      <ConfirmationModal />
    </PlaylistStoreProvider>
  );
}

//#region Screen Header
/** Configuration for the top app bar. */
function ScreenConfig() {
  const { t } = useTranslation();

  const mode = usePlaylistStore((state) => state.mode);
  const isUnchanged = usePlaylistStore((state) => state.isUnchanged);
  const isUnique = usePlaylistStore((state) => state.isUnique);
  const isSubmitting = usePlaylistStore((state) => state.isSubmitting);
  const onSubmit = usePlaylistStore((state) => state.INTERNAL_onSubmit);

  return (
    <Stack.Screen
      options={{
        headerTitle: t(`playlist.${mode ?? "create"}`),
        // Hacky solution to disable the back button when submitting.
        headerLeft: isSubmitting ? () => undefined : undefined,
        headerRight: () => (
          <IconButton
            kind="ripple"
            accessibilityLabel={t("form.apply")}
            disabled={isUnchanged || !isUnique || isSubmitting}
            onPress={onSubmit}
          >
            <Check />
          </IconButton>
        ),
      }}
    />
  );
}
//#endregion

//#region Page Content
/** Items rendered in the `<DragList />`. */
type RenderItemProps = DragListRenderItemInfo<TrackWithAlbum>;

/** Contains the logic for editing the playlist name and tracks. */
function PageContent() {
  const listPresets = useListPresets({ emptyMsgKey: "response.noTracks" });

  const tracks = usePlaylistStore((state) => state.tracks);
  const isUnchanged = usePlaylistStore((state) => state.isUnchanged);
  const isSubmitting = usePlaylistStore((state) => state.isSubmitting);
  const onReorderTrack = usePlaylistStore((state) => state.onReorderTrack);
  const setShowConfirmation = usePlaylistStore(
    (state) => state.setShowConfirmation,
  );

  const renderItem = useCallback(
    (args: RenderItemProps) => <RenderItem {...args} />,
    [],
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isUnchanged) return false;
        if (!isSubmitting) setShowConfirmation(true);
        return true;
      },
    );
    return () => {
      subscription.remove();
    };
  }, [isSubmitting, isUnchanged, setShowConfirmation]);

  return (
    <View
      pointerEvents={isSubmitting ? "none" : "auto"}
      needsOffscreenAlphaCompositing
      className={cn("flex-1", { "opacity-25": isSubmitting })}
    >
      <DragList
        estimatedItemSize={56} // 48px Height + 8px Margin Top
        data={tracks}
        keyExtractor={({ id }) => id}
        renderItem={renderItem}
        onReordered={onReorderTrack}
        ListHeaderComponent={ListHeaderComponent}
        {...listPresets}
        containerStyle={{ flex: 1 }} // Applies to the `<Animated.View />` wrapping the `<FlashList />`.
        contentContainerClassName="py-4" // Applies to the internal `<FlashList />`.
      />
    </View>
  );
}

//#region renderItem
/** Item rendered in the `<DragList />`. */
const RenderItem = memo(function RenderItem({
  item,
  ...info
}: RenderItemProps) {
  const { t } = useTranslation();
  const swipeableRef = useRef<SwipeableRef>(null);
  const [lastItemId, setLastItemId] = useState(item.id);

  const removeTrack = usePlaylistStore((state) => state.onRemoveTrack);

  const onPress = useCallback(
    () => removeTrack(item.id),
    [item.id, removeTrack],
  );

  if (item.id !== lastItemId) {
    setLastItemId(item.id);
    if (swipeableRef.current) swipeableRef.current.resetIfNeeded();
  }

  return (
    <Pressable
      delayLongPress={150}
      onLongPress={info.onDragStart}
      onPressOut={info.onDragEnd}
      className={cn("group bg-canvas", { "mt-2": info.index > 0 })}
    >
      <Swipeable
        // @ts-expect-error - Error assigning ref to class component.
        ref={swipeableRef}
        enabled={!info.isDragging}
        renderRightActions={() =>
          info.isActive ? undefined : (
            <IconButton
              accessibilityLabel={t("template.entryRemove", {
                name: item.name,
              })}
              onPress={onPress}
              className="mr-4 bg-red"
            >
              <Remove color={Colors.neutral100} />
            </IconButton>
          )
        }
      >
        <SearchResult
          type="track"
          title={item.name}
          description={item.artistName ?? "—"}
          imageSource={item.artwork}
          className={cn(
            "mx-4 rounded-sm bg-canvas pr-4 group-active:bg-surface/50",
            { "bg-surface": info.isActive },
          )}
        />
      </Swipeable>
    </Pressable>
  );
}, areRenderItemPropsEqual);

const RenderItemPrimitiveProps = ["index", "isActive", "isDragging"] as const;

function areRenderItemPropsEqual(
  oldProps: RenderItemProps,
  newProps: RenderItemProps,
) {
  const primitiveProps = pickKeys(oldProps, RenderItemPrimitiveProps);
  return (
    oldProps.item.id === newProps.item.id &&
    Object.entries(primitiveProps).every(
      // @ts-expect-error - Non-existent type conflicts.
      ([key, value]) => value === newProps[key],
    )
  );
}
//#endregion

//#region ListHeaderComponent
/** Contains the input to change the playlist name and button to add tracks. */
function ListHeaderComponent() {
  const { t } = useTranslation();

  const initialName = usePlaylistStore((state) => state.initialName);
  const isUnique = usePlaylistStore((state) => state.isUnique);
  const isSubmitting = usePlaylistStore((state) => state.isSubmitting);
  const onRenamePlaylist = usePlaylistStore((state) => state.onRenamePlaylist);
  const addCallbacks = usePlaylistStore(
    (state) => state.AddMusicSheetCallbacks,
  );

  return (
    <>
      <View className="gap-2 px-4">
        <TextInput
          autoFocus={false}
          editable={!isSubmitting}
          defaultValue={initialName}
          onChangeText={onRenamePlaylist}
          placeholder={t("form.placeholder.playlistName")}
          className="shrink grow border-b border-foreground/60"
        />
        <View
          className={cn("shrink flex-row items-center gap-0.5", {
            "opacity-60": !isUnique,
          })}
        >
          {isUnique ? <CheckCircle size={16} /> : <Cancel size={16} />}
          <TStyledText textKey="form.validation.unique" className="text-xs" />
        </View>
      </View>
      <View className="mb-2 ml-4 mr-1 mt-6 shrink grow flex-row items-center justify-between">
        <TStyledText textKey="common.tracks" />
        <IconButton
          kind="ripple"
          accessibilityLabel={t("playlist.add")}
          disabled={isSubmitting}
          onPress={() =>
            SheetManager.show("AddMusicSheet", {
              payload: { callbacks: addCallbacks },
            })
          }
        >
          <Add />
        </IconButton>
      </View>
    </>
  );
}
//#endregion
//#endregion

//#region Confirmation Modal
/** Modal that's rendered if we have unsaved changes. */
function ConfirmationModal() {
  const { t } = useTranslation();

  const showConfirmation = usePlaylistStore((state) => state.showConfirmation);
  const setShowConfirmation = usePlaylistStore(
    (state) => state.setShowConfirmation,
  );

  return (
    <Modal
      animationType="fade"
      visible={showConfirmation}
      statusBarTranslucent
      transparent
    >
      <View className="flex-1 items-center justify-center bg-neutral0/50 px-4">
        <View className="w-full gap-8 rounded-md bg-canvas px-4 dark:bg-neutral5">
          <TStyledText textKey="form.unsaved" className="pt-8 text-center" />
          <View className="flex-row justify-end gap-4">
            <Pressable
              onPress={() => setShowConfirmation(false)}
              className="min-h-12 min-w-12 shrink px-2 py-4 active:opacity-50"
            >
              <StyledText className="text-right text-sm">
                {t("form.stay").toLocaleUpperCase()}
              </StyledText>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              className="min-h-12 min-w-12 shrink px-2 py-4 active:opacity-50"
            >
              <StyledText className="text-right text-sm text-red">
                {t("form.leave").toLocaleUpperCase()}
              </StyledText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
//#endregion

//#region Delete Workflow
/** Logic to handle us deleting the playlist. */
function DeleteWorkflow() {
  const { t } = useTranslation();
  const [lastChance, setLastChance] = useState(false);

  const mode = usePlaylistStore((state) => state.mode);
  const initialPlaylistName = usePlaylistStore((state) => state.initialName);
  const isSubmitting = usePlaylistStore((state) => state.isSubmitting);
  const submit = usePlaylistStore((state) => state.INTERNAL_Submit);
  const deletePlaylist = useDeletePlaylist(initialPlaylistName ?? "");

  if (mode !== "edit") return null;

  const onDelete = async () => {
    submit();
    // Slight buffer before running mutation.
    await wait(100);
    mutateGuard(deletePlaylist, undefined, {
      onSuccess: () => {
        router.back();
        router.back();
      },
    });
  };

  const buttonClass =
    "min-h-12 min-w-12 shrink items-center justify-center px-2 py-4 active:opacity-50";

  return (
    <View
      className={cn("flex-row gap-2 bg-surface px-4", {
        "opacity-25": isSubmitting,
      })}
    >
      <Pressable
        onPress={() => setLastChance(true)}
        disabled={lastChance || isSubmitting}
        className={cn(buttonClass, "grow", { "items-start": lastChance })}
      >
        <StyledText className={cn("text-sm", { "text-red": !lastChance })}>
          {t("playlist.delete").toLocaleUpperCase()}
        </StyledText>
      </Pressable>
      {lastChance ? (
        <>
          <Pressable
            onPress={() => setLastChance(false)}
            disabled={isSubmitting}
            className={buttonClass}
          >
            <StyledText className="text-right text-sm">
              {t("form.cancel").toLocaleUpperCase()}
            </StyledText>
          </Pressable>
          <Pressable
            onPress={onDelete}
            disabled={isSubmitting}
            className={buttonClass}
          >
            <StyledText className="text-right text-sm text-red">
              {t("form.confirm").toLocaleUpperCase()}
            </StyledText>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
//#endregion

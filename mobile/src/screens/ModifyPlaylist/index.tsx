import { Stack, router } from "expo-router";
import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, View } from "react-native";
import type { DragListRenderItemInfo } from "react-native-draglist/dist/FlashList";

import type { SlimTrackWithAlbum } from "~/db/slimTypes";

import { Add } from "~/icons/Add";
import { Cancel } from "~/icons/Cancel";
import { CheckCircle } from "~/icons/CheckCircle";
import { Check } from "~/icons/Check";
import { Remove } from "~/icons/Remove";
import { useDeletePlaylist } from "~/queries/playlist";
import { useTheme } from "~/hooks/useTheme";
import { areRenderItemPropsEqual } from "~/lib/react-native-draglist";
import type { InitStoreProps } from "./context";
import { PlaylistStoreProvider, usePlaylistStore } from "./context";
import { AddMusicSheet } from "./Sheets";

import { Colors } from "~/constants/Styles";
import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { wait } from "~/utils/promise";
import { FlashDragList } from "~/components/Defaults";
import { Button, IconButton } from "~/components/Form/Button";
import { TextInput } from "~/components/Form/Input";
import { Modal, ModalAction } from "~/components/Modal";
import { useSheetRef } from "~/components/Sheet";
import { Swipeable, useSwipeableRef } from "~/components/Swipeable";
import { ContentPlaceholder } from "~/components/Transition/Placeholder";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";
import { SearchResult } from "~/modules/search/components/SearchResult";

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
        headerTitle: t(`feat.playlist.extra.${mode ?? "create"}`),
        // Hacky solution to disable the back button when submitting.
        headerLeft: isSubmitting ? () => undefined : undefined,
        headerRight: () => (
          <IconButton
            Icon={Check}
            accessibilityLabel={t("form.apply")}
            onPress={onSubmit}
            disabled={isUnchanged || !isUnique || isSubmitting}
          />
        ),
      }}
    />
  );
}
//#endregion

//#region Page Content
/** Items rendered in the `<DragList />`. */
type RenderItemProps = DragListRenderItemInfo<SlimTrackWithAlbum>;

/** Contains the logic for editing the playlist name and tracks. */
function PageContent() {
  const tracks = usePlaylistStore((state) => state.tracks);
  const isUnchanged = usePlaylistStore((state) => state.isUnchanged);
  const isSubmitting = usePlaylistStore((state) => state.isSubmitting);
  const moveTrack = usePlaylistStore((state) => state.moveTrack);
  const setShowConfirmation = usePlaylistStore(
    (state) => state.setShowConfirmation,
  );
  const addCallbacks = usePlaylistStore((state) => state.SearchCallbacks);
  const addMusicSheetRef = useSheetRef();

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isUnchanged) return false;
        if (!isSubmitting) setShowConfirmation(true);
        return true;
      },
    );
    return () => subscription.remove();
  }, [isSubmitting, isUnchanged, setShowConfirmation]);

  return (
    <>
      <AddMusicSheet sheetRef={addMusicSheetRef} callbacks={addCallbacks} />
      <View
        pointerEvents={isSubmitting ? "none" : "auto"}
        needsOffscreenAlphaCompositing
        className={cn("flex-1", { "opacity-25": isSubmitting })}
      >
        <FlashDragList
          estimatedItemSize={56} // 48px Height + 8px Margin Top
          data={tracks}
          keyExtractor={({ id }) => id}
          renderItem={(args) => <RenderItem {...args} />}
          onReordered={moveTrack}
          ListHeaderComponent={
            <ListHeaderComponent
              showSheet={() => addMusicSheetRef.current?.present()}
            />
          }
          ListEmptyComponent={
            <ContentPlaceholder errMsgKey="err.msg.noTracks" />
          }
          contentContainerClassName="py-4" // Applies to the internal `<FlashList />`.
        />
      </View>
    </>
  );
}

//#region renderItem
/** Item rendered in the `<DragList />`. */
const RenderItem = memo(
  function RenderItem({ item, ...info }: RenderItemProps) {
    const { t } = useTranslation();
    const swipeableRef = useSwipeableRef();
    const [lastItemId, setLastItemId] = useState(item.id);

    const removeTrack = usePlaylistStore((state) => state.removeTrack);

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
        delayLongPress={100}
        onLongPress={info.onDragStart}
        onPressOut={info.onDragEnd}
        className={cn("group", { "mt-2": info.index > 0 })}
      >
        <Swipeable
          // @ts-expect-error - Error assigning ref to class component.
          ref={swipeableRef}
          enabled={!info.isDragging}
          renderRightActions={() =>
            info.isActive ? undefined : (
              <Button
                accessibilityLabel={t("template.entryRemove", {
                  name: item.name,
                })}
                onPress={onPress}
                className="mr-4 bg-red p-3"
              >
                <Remove color={Colors.neutral100} />
              </Button>
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
              { "!bg-surface": info.isActive },
            )}
          />
        </Swipeable>
      </Pressable>
    );
  },
  areRenderItemPropsEqual((o, n) => o.item.id === n.item.id),
);
//#endregion

//#region ListHeaderComponent
/** Contains the input to change the playlist name and button to add tracks. */
function ListHeaderComponent(props: { showSheet: VoidFunction }) {
  const { t } = useTranslation();

  const initialName = usePlaylistStore((state) => state.initialName);
  const isUnique = usePlaylistStore((state) => state.isUnique);
  const isSubmitting = usePlaylistStore((state) => state.isSubmitting);
  const setPlaylistName = usePlaylistStore((state) => state.setPlaylistName);

  return (
    <>
      <View className="gap-2 px-4">
        <TextInput
          editable={!isSubmitting}
          defaultValue={initialName}
          onChangeText={setPlaylistName}
          placeholder={t("feat.playlist.extra.name")}
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
        <TStyledText textKey="term.tracks" />
        <IconButton
          Icon={Add}
          accessibilityLabel={t("feat.modalTrack.extra.addToPlaylist")}
          onPress={props.showSheet}
          disabled={isSubmitting}
        />
      </View>
    </>
  );
}
//#endregion
//#endregion

//#region Confirmation Modal
/** Modal that's rendered if we have unsaved changes. */
function ConfirmationModal() {
  const showConfirmation = usePlaylistStore((state) => state.showConfirmation);
  const setShowConfirmation = usePlaylistStore(
    (state) => state.setShowConfirmation,
  );

  return (
    <Modal visible={showConfirmation}>
      <TStyledText textKey="form.unsaved" className="pt-8 text-center" />
      <View className="flex-row justify-end gap-4">
        <ModalAction
          textKey="form.stay"
          onPress={() => setShowConfirmation(false)}
        />
        <ModalAction
          textKey="form.leave"
          onPress={() => router.back()}
          danger
        />
      </View>
    </Modal>
  );
}
//#endregion

//#region Delete Workflow
/** Logic to handle us deleting the playlist. */
function DeleteWorkflow() {
  const { t } = useTranslation();
  const { canvas } = useTheme();
  const [lastChance, setLastChance] = useState(false);

  const mode = usePlaylistStore((state) => state.mode);
  const initialPlaylistName = usePlaylistStore((state) => state.initialName);
  const isSubmitting = usePlaylistStore((state) => state.isSubmitting);
  const setIsSubmitting = usePlaylistStore((state) => state.setIsSubmitting);
  const deletePlaylist = useDeletePlaylist(initialPlaylistName ?? "");

  if (mode !== "edit") return null;

  const onDelete = async () => {
    setLastChance(false);
    setIsSubmitting(true);
    // Slight buffer before running mutation.
    await wait(1);
    mutateGuard(deletePlaylist, undefined, {
      onSuccess: () => {
        router.back();
        router.back();
      },
    });
  };

  return (
    <>
      <Pressable
        android_ripple={{ color: canvas }}
        onPress={() => setLastChance(true)}
        disabled={lastChance || isSubmitting}
        className="min-h-12 justify-center bg-surface disabled:opacity-25"
      >
        <StyledText className="text-center text-sm text-red">
          {t("feat.playlist.extra.delete").toLocaleUpperCase()}
        </StyledText>
      </Pressable>
      <Modal visible={lastChance}>
        <TStyledText
          textKey="feat.playlist.extra.delete"
          className="pt-8 text-center"
        />
        <View className="flex-row justify-end gap-4">
          <ModalAction
            textKey="form.cancel"
            onPress={() => setLastChance(false)}
          />
          <ModalAction textKey="form.confirm" onPress={onDelete} danger />
        </View>
      </Modal>
    </>
  );
}
//#endregion

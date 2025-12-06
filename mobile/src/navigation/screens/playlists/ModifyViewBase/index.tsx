import { toast } from "@backpackapp-io/react-native-toast";
import { useNavigation } from "@react-navigation/native";
import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, View } from "react-native";
import type { DragListRenderItemInfo } from "react-native-draglist/dist/FlashList";

import type { SlimTrackWithAlbum } from "~/db/slimTypes";

import { Add } from "~/resources/icons/Add";
import { Cancel } from "~/resources/icons/Cancel";
import { CheckCircle } from "~/resources/icons/CheckCircle";
import { Check } from "~/resources/icons/Check";
import { Delete } from "~/resources/icons/Delete";
import { useDeletePlaylist } from "~/queries/playlist";
import { useFloatingContent } from "../../../hooks/useFloatingContent";
import type { InitStoreProps } from "./store";
import {
  PlaylistStoreProvider,
  useIsPlaylistUnchanged,
  useIsPlaylistUnique,
  usePlaylistStore,
} from "./store";
import { AddMusicSheet } from "./AddMusicSheet";

import { Colors } from "~/constants/Styles";
import { areRenderItemPropsEqual } from "~/lib/react-native-draglist";
import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { ToastOptions } from "~/lib/toast";
import { wait } from "~/utils/promise";
import { FlashDragList } from "~/components/Defaults";
import { Button, IconButton } from "~/components/Form/Button";
import { TextInput } from "~/components/Form/Input";
import { ModalTemplate } from "~/components/Modal";
import { useSheetRef } from "~/components/Sheet";
import { Swipeable } from "~/components/Swipeable";
import { TStyledText } from "~/components/Typography/StyledText";
import { SearchResult } from "~/modules/search/components/SearchResult";
import { readM3UPlaylist } from "~/modules/backup/M3U";
import { ContentPlaceholder } from "../../../components/Placeholder";
import { ScreenOptions } from "../../../components/ScreenOptions";

/** Resuable screen to modify (create or edit) a playlist. */
export function ModifyPlaylistBase(props: InitStoreProps) {
  const { offset, ...rest } = useFloatingContent();

  const RenderedWorkflow = useMemo(
    () => (props.mode === "edit" ? DeleteWorkflow : ImportM3UWorkflow),
    [props.mode],
  );

  return (
    <PlaylistStoreProvider {...props}>
      <ScreenConfig />
      <PageContent bottomOffset={offset} />
      <RenderedWorkflow {...rest} />
      <ConfirmationModal />
    </PlaylistStoreProvider>
  );
}

//#region Screen Header
/** Configuration for the top app bar. */
function ScreenConfig() {
  const { t } = useTranslation();

  const isUnchanged = useIsPlaylistUnchanged();
  const isUnique = useIsPlaylistUnique();
  const mode = usePlaylistStore((s) => s.mode);
  const isSubmitting = usePlaylistStore((s) => s.isSubmitting);
  const onSubmit = usePlaylistStore((s) => s.INTERNAL_onSubmit);

  return (
    <ScreenOptions
      title={`feat.playlist.extra.${mode ?? "create"}`}
      // Hacky solution to disable the back button when submitting.
      headerLeft={isSubmitting ? () => undefined : undefined}
      headerRight={() => (
        <IconButton
          Icon={Check}
          accessibilityLabel={t("form.apply")}
          onPress={onSubmit}
          disabled={isUnchanged || !isUnique || isSubmitting}
        />
      )}
    />
  );
}
//#endregion

//#region Page Content
/** Items rendered in the `<DragList />`. */
type RenderItemProps = DragListRenderItemInfo<SlimTrackWithAlbum>;

/** Contains the logic for editing the playlist name and tracks. */
function PageContent({ bottomOffset }: { bottomOffset: number }) {
  const isUnchanged = useIsPlaylistUnchanged();
  const tracks = usePlaylistStore((s) => s.tracks);
  const isSubmitting = usePlaylistStore((s) => s.isSubmitting);
  const moveTrack = usePlaylistStore((s) => s.moveTrack);
  const removeTrack = usePlaylistStore((s) => s.removeTrack);
  const setShowConfirmation = usePlaylistStore((s) => s.setShowConfirmation);
  const addCallbacks = usePlaylistStore((s) => s.SearchCallbacks);
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
          data={tracks}
          keyExtractor={({ id }) => id}
          renderItem={(args) => <RenderItem {...args} onRemove={removeTrack} />}
          onReordered={moveTrack}
          ListHeaderComponent={
            <ListHeaderComponent
              showSheet={() => addMusicSheetRef.current?.present()}
            />
          }
          ListEmptyComponent={
            <ContentPlaceholder errMsgKey="err.msg.noTracks" />
          }
          contentContainerStyle={{ paddingBottom: bottomOffset }}
          contentContainerClassName="pt-4" // Applies to the internal `<FlashList />`.
        />
      </View>
    </>
  );
}

//#region renderItem
/** Item rendered in the `<DragList />`. */
const RenderItem = memo(
  function RenderItem({
    item,
    onRemove,
    ...info
  }: RenderItemProps & { onRemove: (id: string) => void }) {
    return (
      <Swipeable
        disabled={info.isDragging}
        onSwipeLeft={() => onRemove(item.id)}
        RightIcon={<Delete color={Colors.neutral100} />}
        rightIconContainerClassName="rounded-xs bg-red"
        wrapperClassName={cn("mx-4", { "mt-2": info.index > 0 })}
        className="overflow-hidden rounded-xs bg-canvas"
      >
        <Pressable
          delayLongPress={250}
          onLongPress={info.onDragStart}
          onPressOut={info.onDragEnd}
          className="active:bg-surface/50"
        >
          <SearchResult
            type="track"
            title={item.name}
            description={item.artistName ?? "—"}
            imageSource={item.artwork}
            className={cn("pr-4", { "bg-surface": info.isActive })}
          />
        </Pressable>
      </Swipeable>
    );
  },
  areRenderItemPropsEqual((o, n) => o.item.id === n.item.id),
);
//#endregion

//#region ListHeaderComponent
/** Contains the input to change the playlist name and button to add tracks. */
function ListHeaderComponent(props: { showSheet: VoidFunction }) {
  const { t } = useTranslation();

  const isUnique = useIsPlaylistUnique();
  const isSubmitting = usePlaylistStore((s) => s.isSubmitting);
  const playlistName = usePlaylistStore((s) => s.playlistName);
  const setPlaylistName = usePlaylistStore((s) => s.setPlaylistName);

  return (
    <>
      <View className="gap-2 px-4">
        <TextInput
          editable={!isSubmitting}
          value={playlistName}
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
      <View className="mt-6 mr-1 mb-2 ml-4 shrink grow flex-row items-center justify-between">
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
  const navigation = useNavigation();
  const showConfirmation = usePlaylistStore((s) => s.showConfirmation);
  const setShowConfirmation = usePlaylistStore((s) => s.setShowConfirmation);

  return (
    <ModalTemplate
      visible={showConfirmation}
      titleKey="form.unsaved"
      topAction={{
        textKey: "form.leave",
        onPress: () => navigation.goBack(),
      }}
      bottomAction={{
        textKey: "form.stay",
        onPress: () => setShowConfirmation(false),
      }}
    />
  );
}
//#endregion

//#region Delete Workflow
/** Logic to handle us deleting the playlist. */
function DeleteWorkflow({
  floatingRef,
  wrapperStyling,
}: Omit<ReturnType<typeof useFloatingContent>, "offset">) {
  const navigation = useNavigation();
  const [lastChance, setLastChance] = useState(false);

  const initialPlaylistName = usePlaylistStore((s) => s.initialName);
  const isSubmitting = usePlaylistStore((s) => s.isSubmitting);
  const setIsSubmitting = usePlaylistStore((s) => s.setIsSubmitting);
  const deletePlaylist = useDeletePlaylist(initialPlaylistName ?? "");

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
        <Button
          onPress={() => setLastChance(true)}
          disabled={lastChance || isSubmitting}
          className="w-full bg-red"
        >
          <TStyledText
            textKey="feat.playlist.extra.delete"
            className="text-center text-neutral100"
          />
        </Button>
      </View>
      <ModalTemplate
        visible={lastChance}
        titleKey="feat.playlist.extra.delete"
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

//#region Import M3U Workflow
/** Logic to handle importing a playlist from an M3U file. */
function ImportM3UWorkflow({
  floatingRef,
  wrapperStyling,
}: Omit<ReturnType<typeof useFloatingContent>, "offset">) {
  const { t } = useTranslation();

  const isSubmitting = usePlaylistStore((s) => s.isSubmitting);
  const setIsSubmitting = usePlaylistStore((s) => s.setIsSubmitting);
  const _setTracks = usePlaylistStore((s) => s._setTracks);
  const playlistName = usePlaylistStore((s) => s.playlistName);
  const setPlaylistName = usePlaylistStore((s) => s.setPlaylistName);

  const onImport = async () => {
    setIsSubmitting(true);
    try {
      const { name, tracks: playlistTracks } = await readM3UPlaylist();
      toast(t("feat.backup.extra.importSuccess"), ToastOptions);
      _setTracks(playlistTracks);
      if (!playlistName && !!name) setPlaylistName(name);
    } catch (err) {
      toast.error((err as Error).message, ToastOptions);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View ref={floatingRef} {...wrapperStyling}>
      <Button
        onPress={onImport}
        disabled={isSubmitting}
        className="w-full bg-yellow"
      >
        <TStyledText
          textKey="feat.playlist.extra.m3uImport"
          className="text-center text-neutral0"
        />
      </Button>
    </View>
  );
}
//#endregion

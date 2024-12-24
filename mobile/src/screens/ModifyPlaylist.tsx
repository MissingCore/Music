import { toast } from "@backpackapp-io/react-native-toast";
import { Stack, router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Modal, Pressable, View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import type { DragListRenderItemInfo } from "react-native-draglist";
import DragList from "react-native-draglist";

import type { TrackWithAlbum } from "@/db/schema";
import { mergeTracks, sanitizePlaylistName } from "@/db/utils";

import { Add, Cancel, Check, CheckCircle, Remove } from "@/icons";
import { useDeletePlaylist, usePlaylists } from "@/queries/playlist";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { ToastOptions } from "@/lib/toast";
import { wait } from "@/utils/promise";
import { useListPresets } from "@/components/Defaults";
import { IconButton, TextInput } from "@/components/Form";
import { Swipeable } from "@/components/Swipeable";
import { StyledText, TStyledText } from "@/components/Typography";
import { SearchResult } from "@/modules/search/components";
import type { SearchCallbacks } from "@/modules/search/types";

type ScreenModeOptions =
  | { mode?: "create"; initialName?: never; initialTracks?: never }
  | { mode: "edit"; initialName: string; initialTracks: TrackWithAlbum[] };

type ScreenOptions = ScreenModeOptions & {
  onSubmit: (playlistName: string, tracks: TrackWithAlbum[]) => Promise<void>;
};

/** Resuable screen to modify (create or edit) a playlist. */
export function ModifyPlaylist(props: ScreenOptions) {
  const { t } = useTranslation();
  const { data } = usePlaylists();
  const listPresets = useListPresets({ emptyMsgKey: "response.noTracks" });
  const [unsavedDialog, setUnsavedDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playlistName, setPlaylistName] = useState(props.initialName ?? "");
  const [tracks, setTracks] = useState(props.initialTracks ?? []);

  const isUnchanged = useMemo(() => {
    let nameUnchanged = !playlistName; // `true` if empty.
    if (!!props.initialName) {
      nameUnchanged = props.initialName === playlistName.trim();
    }
    let tracksUnchanged = tracks.length === 0;
    if (props.initialTracks) {
      tracksUnchanged =
        props.initialTracks.length === tracks.length &&
        props.initialTracks.every((t, index) => t.id === tracks[index]?.id);
    }
    return nameUnchanged && tracksUnchanged;
  }, [props.initialName, props.initialTracks, playlistName, tracks]);

  const isUnique = useMemo(() => {
    if (!data) return false;
    const usedNames = data.map(({ name }) => name);
    try {
      const sanitized = sanitizePlaylistName(playlistName);
      return sanitized === props.initialName || !usedNames.includes(sanitized);
    } catch {
      // `sanitizePlaylistName` will throw an error if the value is a reserved
      // name or is empty.
      return false;
    }
  }, [props.initialName, data, playlistName]);

  const addCallbacks = useMemo(() => {
    return {
      album: ({ tracks, ...album }) => {
        setTracks((prev) =>
          mergeTracks(
            prev,
            tracks.map(({ artwork, ...t }) => {
              return { ...t, artwork: album.artwork ?? artwork, album };
            }),
          ),
        );
        toast(t("template.entryAdded", { name: album.name }), ToastOptions);
      },
      track: (track) => {
        setTracks((prev) =>
          prev.filter(({ id }) => track.id !== id).concat(track),
        );
        toast(t("template.entryAdded", { name: track.name }), ToastOptions);
      },
    } satisfies Pick<SearchCallbacks, "album" | "track">;
  }, [t]);

  const onCloseDialog = useCallback(() => setUnsavedDialog(false), []);

  const onDelete = useCallback(() => setIsSubmitting(true), []);

  const renderItem = useCallback(
    (info: DragListRenderItemInfo<TrackWithAlbum>) => (
      <Pressable
        delayLongPress={150}
        onLongPress={info.onDragStart}
        onPressOut={info.onDragEnd}
        className={cn("active:opacity-75", { "mt-2": info.index > 0 })}
      >
        <SearchResult
          type="track"
          title={info.item.name}
          description={info.item.artistName ?? "—"}
          imageSource={info.item.artwork}
          className={cn("mx-4 rounded-sm bg-canvas", {
            "bg-surface": info.isActive,
          })}
        />
      </Pressable>
    ),
    [],
  );

  const onReorder = useCallback((fromIndex: number, toIndex: number) => {
    setTracks((prev) => {
      const copy = [...prev];
      const moved = copy.splice(fromIndex, 1);
      return copy.toSpliced(toIndex, 0, moved[0]!);
    });
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isUnchanged) return false;
        if (!isSubmitting) setUnsavedDialog(true);
        return true;
      },
    );
    return () => {
      subscription.remove();
    };
  }, [isSubmitting, isUnchanged]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: t(`playlist.${props.mode ?? "create"}`),
          // Hacky solution to disable the back button when submitting.
          headerLeft: isSubmitting ? () => undefined : undefined,
          headerRight: () => (
            <IconButton
              kind="ripple"
              accessibilityLabel={t("form.apply")}
              disabled={isUnchanged || !isUnique || isSubmitting}
              onPress={async () => {
                try {
                  const sanitized = sanitizePlaylistName(playlistName);
                  setIsSubmitting(true);
                  // Slight buffer before running mutation.
                  await wait(100);
                  await props.onSubmit(sanitized, tracks);
                } catch {}
                setIsSubmitting(false);
              }}
            >
              <Check />
            </IconButton>
          ),
        }}
      />
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
          onReordered={onReorder}
          ListHeaderComponent={
            <HeaderActions
              initialValue={props.initialName}
              isUnique={isUnique}
              addCallbacks={addCallbacks}
              disabled={isSubmitting}
              onNameChange={setPlaylistName}
            />
          }
          {...listPresets}
          containerStyle={{ flex: 1 }} // Applies to the `<Animated.View />` wrapping the `<FlashList />`.
          contentContainerClassName="py-4" // Applies to the internal `<FlashList />`.
        />
      </View>
      <DeleteWorkflow
        playlistName={props.initialName ?? ""}
        visible={props.mode === "edit"}
        isSubmitting={isSubmitting}
        onDelete={onDelete}
      />
      <UnsavedModal visible={unsavedDialog} onClose={onCloseDialog} />
    </>
  );
}

//#region Input Actions
/** Contains the input to change the playlist name and button to add tracks. */
const HeaderActions = memo(function HeaderActions(props: {
  initialValue?: string;
  isUnique: boolean;
  disabled?: boolean;
  addCallbacks: Pick<SearchCallbacks, "album" | "track">;
  onNameChange: (newName: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <View className="gap-2 px-4">
        <TextInput
          autoFocus={false}
          editable={!props.disabled}
          defaultValue={props.initialValue}
          onChangeText={props.onNameChange}
          placeholder={t("form.placeholder.playlistName")}
          className="shrink grow border-b border-foreground/60"
        />
        <View
          className={cn("shrink flex-row items-center gap-0.5", {
            "opacity-60": !props.isUnique,
          })}
        >
          {props.isUnique ? <CheckCircle size={16} /> : <Cancel size={16} />}
          <TStyledText textKey="form.validation.unique" className="text-xs" />
        </View>
      </View>
      <View className="mb-2 ml-4 mr-1 mt-6 shrink grow flex-row items-center justify-between">
        <TStyledText textKey="common.tracks" />
        <IconButton
          kind="ripple"
          accessibilityLabel={t("playlist.add")}
          disabled={props.disabled}
          onPress={() =>
            SheetManager.show("AddMusicSheet", {
              payload: { callbacks: props.addCallbacks },
            })
          }
        >
          <Add />
        </IconButton>
      </View>
    </>
  );
});
//#endregion

//#region Unsaved Modal
/** Modal that's rendered if we have unsaved changes. */
const UnsavedModal = memo(function UnsavedModal(props: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      animationType="fade"
      visible={props.visible}
      statusBarTranslucent
      transparent
    >
      <View className="flex-1 items-center justify-center bg-neutral0/50 px-4">
        <View className="w-full gap-8 rounded-md bg-canvas px-4 dark:bg-neutral5">
          <TStyledText textKey="form.unsaved" className="pt-8 text-center" />
          <View className="flex-row justify-end gap-4">
            <Pressable
              onPress={props.onClose}
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
});
//#endregion

//#region Delete Workflow
/** Logic to handle us deleting the playlist. */
const DeleteWorkflow = memo(function DeleteWorkflow(props: {
  playlistName: string;
  visible: boolean;
  isSubmitting: boolean;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [lastChance, setLastChance] = useState(false);
  const deletePlaylist = useDeletePlaylist(props.playlistName);

  if (!props.visible) return null;

  const onDelete = async () => {
    props.onDelete();
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
        "opacity-25": props.isSubmitting,
      })}
    >
      <Pressable
        onPress={() => setLastChance(true)}
        disabled={lastChance || props.isSubmitting}
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
            disabled={props.isSubmitting}
            className={buttonClass}
          >
            <StyledText className="text-right text-sm">
              {t("form.cancel").toLocaleUpperCase()}
            </StyledText>
          </Pressable>
          <Pressable
            onPress={onDelete}
            disabled={props.isSubmitting}
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
});
//#endregion

import { toast } from "@backpackapp-io/react-native-toast";
import { Stack, router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Modal, Pressable, View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import type { TrackWithAlbum } from "@/db/schema";
import { sanitizePlaylistName } from "@/db/utils";

import { Add, Cancel, Check, CheckCircle, Remove } from "@/icons";
import { usePlaylists } from "@/queries/playlist";

import { Colors } from "@/constants/Styles";
import { ToastOptions } from "@/lib/toast";
import { cn } from "@/lib/style";
import { FlashList } from "@/components/Defaults";
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
  const [unsavedDialog, setUnsavedDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [tracks, setTracks] = useState(props.initialTracks ?? []);

  const isUnchanged = useMemo(() => {
    let nameUnchanged = !playlistName; // `true` if empty.
    if (!!props.initialName) nameUnchanged = props.initialName === playlistName;
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
        const trackIds = new Set(tracks.map(({ id }) => id));
        setTracks((prev) =>
          prev
            .filter(({ id }) => !trackIds.has(id))
            .concat(
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
              disabled={!isUnique || isSubmitting}
              onPress={async () => {
                try {
                  const sanitized = sanitizePlaylistName(playlistName);
                  setIsSubmitting(true);
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
        <FlashList
          estimatedItemSize={56} // 48px Height + 8px Margin Top
          data={tracks}
          keyExtractor={({ id }) => id}
          renderItem={({ item, index }) => (
            <Swipeable
              renderRightActions={() => (
                <IconButton
                  accessibilityLabel={t("template.entryRemove", {
                    name: item.name,
                  })}
                  onPress={() =>
                    setTracks((prev) => prev.filter(({ id }) => id !== item.id))
                  }
                  className="mr-4 bg-red"
                >
                  <Remove color={Colors.neutral100} />
                </IconButton>
              )}
              childrenContainerClassName="bg-canvas px-4"
              containerClassName={index > 0 ? "mt-2" : undefined}
            >
              <SearchResult
                {...{ type: "track", title: item.name }}
                imageSource={item.artwork}
              />
            </Swipeable>
          )}
          ListHeaderComponent={
            <HeaderActions
              initialValue={props.initialName}
              isUnique={isUnique}
              addCallbacks={addCallbacks}
              disabled={isSubmitting}
              onNameChange={setPlaylistName}
            />
          }
          emptyMsgKey="response.noTracks"
          contentContainerClassName="py-4"
        />
      </View>
      <UnsavedModal visible={unsavedDialog} onClose={onCloseDialog} />
    </>
  );
}

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
              className="min-h-12 min-w-12 shrink px-2 py-4"
            >
              <StyledText className="text-right text-sm">
                {t("form.stay").toLocaleUpperCase()}
              </StyledText>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              className="min-h-12 min-w-12 shrink px-2 py-4"
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

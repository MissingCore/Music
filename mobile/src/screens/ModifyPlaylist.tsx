import { Stack } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Modal, View } from "react-native";

import type { TrackWithAlbum } from "@/db/schema";
import { sanitizePlaylistName } from "@/db/utils";

import { Add, Cancel, Check, CheckCircle, Remove } from "@/icons";
import { usePlaylists } from "@/queries/playlist";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { FlashList } from "@/components/Defaults";
import { IconButton, TextInput } from "@/components/Form";
import { Swipeable } from "@/components/Swipeable";
import { StyledText, TStyledText } from "@/components/Typography";
import { SearchResult } from "@/modules/search/components";

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
  const [playlistName, setPlaylistName] = useState<string>();
  const [tracks, setTracks] = useState(props.initialTracks ?? []);

  const isUnique = useMemo(() => {
    if (!playlistName || !data) return false;
    const usedNames = data.map(({ name }) => name);
    try {
      const sanitized = sanitizePlaylistName(playlistName);
      return sanitized === props.initialName || !usedNames.includes(sanitized);
    } catch {
      // `sanitizePlaylistName` will throw an error if the value is a reserved
      // name of is empty.
      return false;
    }
  }, [props.initialName, data, playlistName]);

  const addTracks = useCallback(() => {
    console.log("Adding tracks...");
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: t(`playlist.${props.mode ?? "create"}`),
          headerRight: () => (
            <IconButton
              kind="ripple"
              accessibilityLabel={t("form.apply")}
              disabled={!isUnique}
              onPress={() => console.log("Applying changes to playlist...")}
            >
              <Check />
            </IconButton>
          ),
        }}
      />
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
                onPress={() => console.log("Removing track from playlist...")}
                className="mr-4 bg-red"
              >
                <Remove color={Colors.neutral100} />
              </IconButton>
            )}
            childrenContainerClassName="px-4"
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
            addTracks={addTracks}
            onNameChange={setPlaylistName}
          />
        }
        emptyMsgKey="response.noTracks"
        className="p-4"
      />
    </>
  );
}

/** Contains the input to change the playlist name and button to add tracks. */
const HeaderActions = memo(function HeaderActions(props: {
  initialValue?: string;
  isUnique: boolean;
  disabled?: boolean;
  addTracks: (tracks: TrackWithAlbum[]) => void;
  onNameChange: (newName: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <View className={cn("gap-2", { "opacity-25": props.disabled })}>
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
      <View className="-mr-3 mb-2 mt-6 shrink grow flex-row items-center justify-between">
        <TStyledText textKey="common.tracks" />
        <IconButton
          kind="ripple"
          accessibilityLabel={t("playlist.add")}
          disabled={props.disabled}
          onPress={() => console.log("Opening add to playlist modal...")}
        >
          <Add />
        </IconButton>
      </View>
    </>
  );
});

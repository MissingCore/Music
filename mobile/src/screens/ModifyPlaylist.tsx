import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Modal, View } from "react-native";

import type { TrackWithAlbum } from "@/db/schema";

import { Add, Cancel, Check, CheckCircle, Remove } from "@/icons";

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
  const [playlistName, setPlaylistName] = useState<string>();
  const [tracks, setTracks] = useState(props.initialTracks ?? []);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: t(`playlist.${props.mode ?? "create"}`),
          headerRight: () => (
            <IconButton
              kind="ripple"
              accessibilityLabel={t("form.apply")}
              disabled={!playlistName || playlistName === props.initialName}
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
            isUnique={false}
            addTracks={() => console.log("Adding tracks...")}
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
function HeaderActions(props: {
  initialValue?: string;
  isUnique: boolean;
  addTracks: (tracks: TrackWithAlbum[]) => void;
  onNameChange: (newName: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <View className="gap-2">
        <TextInput
          autoFocus={false}
          editable={true}
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
          onPress={() => console.log("Opening add to playlist modal...")}
        >
          <Add />
        </IconButton>
      </View>
    </>
  );
}

import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { useCreatePlaylist, usePlaylistsForModal } from "@/api/playlists";
import { useUpdatePlaylist } from "@/api/playlists/[id]";
import type { ModalPlaylistName } from "../store";

import Colors from "@/constants/Colors";
import { cn } from "@/lib/style";
import { mutateGuard } from "@/lib/react-query";
import { ReservedNames } from "@/features/playback/utils/trackList";
import { ModalBase } from "../components/ModalBase";
import { ModalFormButton } from "../components/ModalFormButton";
import { Title } from "../components/ModalUI";

/** @description Modal used for creating or changing a playlist name. */
export function PlaylistNameModal({ origin, id }: ModalPlaylistName) {
  const [playlistName, setPlaylistName] = useState(origin === "new" ? "" : id!);
  const { isPending, error, data } = usePlaylistsForModal();
  const createPlaylist = useCreatePlaylist();
  const updatePlaylistFn = useUpdatePlaylist(id ?? "");

  const meetsCharLength = useMemo(() => {
    const santiziedStr = playlistName.trim();
    return santiziedStr.length >= 1 && santiziedStr.length <= 30;
  }, [playlistName]);

  const isUnique = useMemo(() => {
    if (!data) return false;
    const santiziedStr = playlistName.trim();
    const usedNames = new Set(data.map(({ name }) => name));
    return (
      !!santiziedStr &&
      !usedNames.has(playlistName) &&
      !ReservedNames.has(playlistName)
    );
  }, [data, playlistName]);

  if (isPending || error) return null;

  return (
    <ModalBase detached>
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        className="px-4"
      >
        <Title className="mb-8">
          {origin === "new" ? "Create a Playlist" : "Rename Playlist"}
        </Title>

        <BottomSheetTextInput
          autoFocus
          value={playlistName}
          maxLength={30}
          onChangeText={(text) => setPlaylistName(text)}
          placeholder="Playlist Name"
          placeholderTextColor={Colors.surface400}
          className={cn(
            "mb-2 border-b border-b-foreground100 px-2 py-1",
            "font-geistMonoLight text-lg text-foreground100",
          )}
        />
        <View className="mb-8 flex-row gap-2">
          <Requirement
            satisfied={meetsCharLength}
            description="1-30 Characters"
          />
          <Requirement satisfied={isUnique} description="Unique" />
        </View>

        <View className="flex-row justify-end gap-2">
          {origin === "update" && <ModalFormButton content="CANCEL" />}
          <ModalFormButton
            disabled={!meetsCharLength || !isUnique}
            theme={origin === "new" ? "default" : "secondary"}
            onPress={() => {
              const santiziedStr = playlistName.trim();
              if (origin === "new") mutateGuard(createPlaylist, santiziedStr);
              else {
                mutateGuard(updatePlaylistFn, {
                  field: "name",
                  value: santiziedStr,
                });
              }
            }}
            content={origin === "new" ? "CREATE" : "CONFIRM"}
          />
        </View>
      </BottomSheetScrollView>
    </ModalBase>
  );
}

type RequirementProps = { satisfied: boolean; description: string };

/** @description Displays a requirement. */
function Requirement({ satisfied, description }: RequirementProps) {
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons
        name={satisfied ? "checkmark-circle" : "close-circle-outline"}
        size={24}
        color={satisfied ? Colors.foreground100 : Colors.surface500}
      />
      <Text
        className={cn("font-geistMonoLight text-sm text-surface500", {
          "text-foreground100": satisfied,
        })}
      >
        {description}
      </Text>
    </View>
  );
}

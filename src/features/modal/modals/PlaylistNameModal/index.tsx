import Ionicons from "@expo/vector-icons/Ionicons";
import { BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { useCreatePlaylist } from "@/features/playlist/api/createPlaylist";
import { usedPlaylistNamesAtom } from "./store";
import type { PlaylistNameModalConfig } from "../../store";

import Colors from "@/constants/Colors";
import { cn } from "@/lib/style";
import { mutateGuard } from "@/lib/react-query";
import { TextLine } from "@/components/ui/Text";
import { SpecialPlaylists } from "@/features/playback/utils/trackList";
import { ModalBase } from "../../components/ModalBase";
import { ModalFormButton } from "../../components/ModalFormButton";

/** @description Modal used for creating or changing a playlist name. */
export function PlaylistNameModal({ origin, ref }: PlaylistNameModalConfig) {
  const [playlistName, setPlaylistName] = useState("");
  const [usedNames, updateUsedNames] = useAtom(usedPlaylistNamesAtom);
  const createPlaylist = useCreatePlaylist();

  const meetsCharLength = useMemo(() => {
    const santiziedStr = playlistName.trim();
    return santiziedStr.length >= 1 && santiziedStr.length <= 30;
  }, [playlistName]);

  const isUnique = useMemo(() => {
    const santiziedStr = playlistName.trim();
    const reservedNames = new Set<string>(Object.values(SpecialPlaylists));
    return (
      !!santiziedStr &&
      !usedNames.has(playlistName) &&
      !reservedNames.has(playlistName)
    );
  }, [usedNames, playlistName]);

  return (
    <ModalBase>
      <BottomSheetView>
        <TextLine className="px-4 text-center font-ndot57 text-title text-foreground50">
          Create a Playlist
        </TextLine>
        <View className="mt-4 p-8">
          <BottomSheetTextInput
            value={playlistName}
            maxLength={30}
            onChangeText={(text) => setPlaylistName(text)}
            placeholder="New Playlist"
            placeholderTextColor={Colors.foreground100}
            className={cn(
              "mb-2 border-b border-b-foreground100 px-2 py-1",
              "font-geistMonoLight text-lg text-foreground100",
            )}
          />
          <View className="flex-row gap-2">
            <Requirement
              satisfied={meetsCharLength}
              description="1-30 Characters"
            />
            <Requirement satisfied={isUnique} description="Unique" />
          </View>
        </View>
        <ModalFormButton
          disabled={!meetsCharLength || !isUnique}
          onPress={() => {
            const santiziedStr = playlistName.trim();
            mutateGuard(createPlaylist, santiziedStr);
            updateUsedNames({ type: "add", name: santiziedStr });
          }}
          content="CREATE"
          className="m-8 self-end"
        />
      </BottomSheetView>
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

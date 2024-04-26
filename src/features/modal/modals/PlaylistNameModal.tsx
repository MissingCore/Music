import Ionicons from "@expo/vector-icons/Ionicons";
import { BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { useCreatePlaylist } from "@/features/playlist/api/createPlaylist";
import { useUpdatePlaylistName } from "@/features/playlist/api/updatePlaylistName";
import { usePlaylists } from "@/features/playlist/api/getPlaylists";
import type { ModalPlaylistName } from "../store";

import Colors from "@/constants/Colors";
import { cn } from "@/lib/style";
import { mutateGuard } from "@/lib/react-query";
import { TextLine } from "@/components/ui/Text";
import { ReservedNames } from "@/features/playback/utils/trackList";
import { ModalBase } from "../components/ModalBase";
import { ModalFormButton } from "../components/ModalFormButton";

/** @description Modal used for creating or changing a playlist name. */
export function PlaylistNameModal({ origin, id }: ModalPlaylistName) {
  const [playlistName, setPlaylistName] = useState(origin === "new" ? "" : id!);
  const { isPending, error, data } = usePlaylists();
  const createPlaylist = useCreatePlaylist();
  const updatePlaylistName = useUpdatePlaylistName(id ?? "");

  const snapPoints = useMemo(() => ["50%", "90%"], []);

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
    <ModalBase snapPoints={snapPoints}>
      <BottomSheetView className="px-6">
        <TextLine className="mb-8 text-center font-ndot57 text-title text-foreground50">
          {origin === "new" ? "Create a Playlist" : "Rename Playlist"}
        </TextLine>
        <View className="mb-6">
          <BottomSheetTextInput
            value={playlistName}
            maxLength={30}
            onChangeText={(text) => setPlaylistName(text)}
            placeholder="New Playlist"
            placeholderTextColor={Colors.surface400}
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
        <View className="my-6 flex-row justify-end gap-2">
          {origin === "update" && <ModalFormButton content="CANCEL" />}
          <ModalFormButton
            disabled={!meetsCharLength || !isUnique}
            theme={origin === "new" ? "default" : "secondary"}
            onPress={() => {
              const santiziedStr = playlistName.trim();
              if (origin === "new") mutateGuard(createPlaylist, santiziedStr);
              else mutateGuard(updatePlaylistName, santiziedStr);
            }}
            content={origin === "new" ? "CREATE" : "CONFIRM"}
          />
        </View>
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

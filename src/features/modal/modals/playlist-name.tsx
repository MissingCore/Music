import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { useCreatePlaylist, usePlaylistsForModal } from "@/api/playlists";
import { useUpdatePlaylist } from "@/api/playlists/[id]";

import { Colors } from "@/constants/Styles";
import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { Heading } from "@/components/ui/text";
import { ReservedNames } from "@/features/playback/constants";
import { ModalFormButton } from "../components/form-button";
import { ModalBase } from "../components/modal-base";

type Props = { id?: string; scope: "new" | "update" };

/** @description Modal used for creating or changing a playlist name. */
export function PlaylistNameModal({ id, scope }: Props) {
  const [playlistName, setPlaylistName] = useState(scope === "new" ? "" : id!);
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
      !usedNames.has(santiziedStr) &&
      !ReservedNames.has(santiziedStr)
    );
  }, [data, playlistName]);

  if (isPending || error) return null;

  return (
    <ModalBase detached>
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        className="px-4"
      >
        <Heading as="h1" className="mb-8">
          {scope === "new" ? "Create a Playlist" : "Rename Playlist"}
        </Heading>

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
          {scope === "update" && (
            <ModalFormButton variant="outline">CANCEL</ModalFormButton>
          )}
          <ModalFormButton
            disabled={!meetsCharLength || !isUnique}
            variant={scope === "new" ? "outline" : undefined}
            theme={scope === "new" ? undefined : "neutral"}
            onPress={() => {
              const santiziedStr = playlistName.trim();
              if (scope === "new") mutateGuard(createPlaylist, santiziedStr);
              else {
                mutateGuard(updatePlaylistFn, {
                  field: "name",
                  value: santiziedStr,
                });
              }
            }}
          >
            {scope === "new" ? "CREATE" : "CONFIRM"}
          </ModalFormButton>
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

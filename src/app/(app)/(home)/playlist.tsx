import Ionicons from "@expo/vector-icons/Ionicons";
import { useSetAtom } from "jotai";
import { Pressable, ScrollView } from "react-native";

import { DashedBorder } from "@/assets/svgs/DashedBorder";
import { usePlaylistsForMediaCard } from "@/api/playlists";
import { useGetColumnWidth } from "@/hooks/layout";
import { modalAtom } from "@/features/modal/store";

import { Colors } from "@/constants/Styles";
import { MediaCard } from "@/components/media/MediaCard";

/** @description Screen for `/playlist` route. */
export default function PlaylistScreen() {
  const colWidth = useGetColumnWidth({
    cols: 2,
    gap: 16,
    gutters: 32,
    minWidth: 175,
  });

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pt-[22px] p-4 flex-row flex-wrap gap-4 w-full"
    >
      <CreatePlaylistButton colWidth={colWidth} />
      <AllPlaylists colWidth={colWidth} />
    </ScrollView>
  );
}

/** @description Opens up a modal to create a new playlist. */
function CreatePlaylistButton({ colWidth }: { colWidth: number }) {
  const openModal = useSetAtom(modalAtom);

  return (
    <Pressable
      onPress={() => openModal({ type: "playlist-name", origin: "new" })}
      style={{ width: colWidth, height: colWidth }}
      className="items-center justify-center rounded-lg active:bg-surface800"
    >
      <DashedBorder size={colWidth} />
      <Ionicons name="add-outline" size={36} color={Colors.foreground100} />
    </Pressable>
  );
}

/** @description An array of playlist `<MediaCards />`. */
function AllPlaylists({ colWidth }: { colWidth: number }) {
  const { isPending, error, data } = usePlaylistsForMediaCard();
  if (isPending || error) return null;
  return data.map((props) => (
    <MediaCard key={props.href} {...props} size={colWidth} />
  ));
}

import _Ionicons from "@expo/vector-icons/Ionicons";
import _MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { View } from "react-native";

import * as _MaterialSymbols from "./MaterialSymbol";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";

type IconProps<IconNames extends string> = {
  name: IconNames;
  size?: number;
  color?: string;
  /** Apply `className` to the `<View />` wrapping the SVG. */
  className?: string;
};

export function Ionicons({
  name,
  size = 24,
  color = Colors.foreground50,
  className,
}: IconProps<React.ComponentProps<typeof _Ionicons>["name"]>) {
  return (
    <View className={cn("pointer-events-none", className)}>
      <_Ionicons {...{ name, size, color }} />
    </View>
  );
}

export function MaterialIcons({
  name,
  size = 24,
  color = Colors.foreground50,
  className,
}: IconProps<React.ComponentProps<typeof _MaterialIcons>["name"]>) {
  return (
    <View className={cn("pointer-events-none", className)}>
      <_MaterialIcons {...{ name, size, color }} />
    </View>
  );
}

const MaterialSymbolMapping = {
  "album-outline": _MaterialSymbols.AlbumOutline,
  "artist-outline": _MaterialSymbols.ArtistOutline,
  "close-outline": _MaterialSymbols.CloseOutline,
  "create-new-folder-outline": _MaterialSymbols.CreateNewFolderOutline,
  "delete-outline": _MaterialSymbols.DeleteOutline,
  favorite: _MaterialSymbols.FavoriteFilled,
  "favorite-outline": _MaterialSymbols.FavoriteOutline,
  "folder-outline": _MaterialSymbols.FolderOutline,
  "hide-image-outline": _MaterialSymbols.HideImageOutline,
  "image-outline": _MaterialSymbols.ImageOutline,
  "library-music": _MaterialSymbols.LibraryMusicFilled,
  "list-outline": _MaterialSymbols.ListOutline,
  "match-case-outline": _MaterialSymbols.MatchCaseOutline,
  "open-in-new-outline": _MaterialSymbols.OpenInNewOutline,
  "playlist-add-outline": _MaterialSymbols.PlaylistAddOutline,
  "queue-music-outline": _MaterialSymbols.QueueMusicOutline,
} as const;

export namespace MaterialSymbols {
  export type Names = keyof typeof MaterialSymbolMapping;
}

export function MaterialSymbols({
  name,
  size = 24,
  color = Colors.foreground50,
  className,
}: IconProps<MaterialSymbols.Names>) {
  const Icon = MaterialSymbolMapping[name];
  return (
    <View className={cn("pointer-events-none", className)}>
      <Icon {...{ size, color }} />
    </View>
  );
}

export { Add } from "./Add";
export { ArrowBack } from "./ArrowBack";
export { CreateNewFolder } from "./CreateNewFolder";
export { LogoGitHub } from "./LogoGitHub";
export { LogoPlayStore } from "./LogoPlayStore";
export { OpenInNew } from "./OpenInNew";
export { Remove } from "./Remove";

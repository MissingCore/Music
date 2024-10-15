import type { Href } from "expo-router";
import { router } from "expo-router";
import { Pressable } from "react-native";

import type { Prettify } from "@/utils/types";
import { StyledText } from "@/components/new/Typography";
import { MediaImage } from "./MediaImage";

export namespace MediaCard {
  export type Content = Prettify<
    MediaImage.ImageContent & {
      href: string;
      title: string;
      subtitle: string;
    }
  >;

  export type Props = Prettify<Content & { size: number }>;
}

/**
 * Card containing information about some media and navigate to that media's
 * page on click.
 */
export function MediaCard({
  href,
  title,
  subtitle,
  ...imgProps
}: MediaCard.Props) {
  return (
    <Pressable
      onPress={() => router.navigate(href as Href)}
      style={{ maxWidth: imgProps.size }}
      // The `w-full` is to ensure the component takes up all the space
      // specified by `maxWidth`.
      className="w-full active:opacity-75"
    >
      <MediaImage {...imgProps} />
      <StyledText numberOfLines={1} className="mt-1 text-sm">
        {title}
      </StyledText>
      <StyledText preset="dimOnCanvas" numberOfLines={1}>
        {subtitle}
      </StyledText>
    </Pressable>
  );
}

/**
 * Placeholder content — useful in `<FlatList />` if we want to do
 * something special for the first item.
 */
export const MediaCardPlaceholderContent: MediaCard.Content = {
  href: "invalid-href",
  source: null,
  title: "",
  subtitle: "",
  type: "album",
};

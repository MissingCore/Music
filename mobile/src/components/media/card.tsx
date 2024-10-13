import type { Href } from "expo-router";
import { Link } from "expo-router";
import { Pressable } from "react-native";

import type { Prettify } from "@/utils/types";
import { MediaImage } from "@/modules/media/components";
import { TextStack } from "../ui/text";

export namespace MediaCard {
  export type Content = Prettify<
    MediaImage.ImageContent & {
      href: string;
      title: string;
      subtitle: string;
      extra?: string | null;
    }
  >;

  export type Props = Prettify<Content & { size: number }>;
}

/**
 * Link containing information about a media and takes the user to that
 * media's page.
 */
export function MediaCard({ type, size, source, ...props }: MediaCard.Props) {
  return (
    <Link href={props.href as Href} asChild>
      <Pressable
        style={{ maxWidth: size }}
        className="w-full active:opacity-75"
      >
        {/* @ts-expect-error Incompatible types */}
        <MediaImage {...{ type, size, source }} />
        <TextStack
          content={[props.title, props.subtitle, props.extra]}
          wrapperClassName="mt-0.5 px-1"
        />
      </Pressable>
    </Link>
  );
}

/**
 * Placeholder content — useful in `<FlatList />` if we want to do
 * something special for the first item.
 */
export const PlaceholderContent: MediaCard.Content = {
  href: "invalid-href",
  source: null,
  title: "",
  subtitle: "",
  type: "album",
};

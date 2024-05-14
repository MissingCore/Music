import { Link } from "expo-router";
import { Pressable } from "react-native";

import type { Prettify } from "@/utils/types";
import { TextStack } from "@/components/ui/Text";
import type { MediaImageProps } from "./MediaImage";
import { MediaImage } from "./MediaImage";

export type MediaCardContent = Prettify<
  Pick<MediaImageProps, "source" | "type"> & {
    href: string;
    title: string;
    subtitle: string;
    extra?: string | null;
  }
>;

export type MediaCardProps = MediaCardContent &
  Omit<MediaImageProps, "className">;

/**
 * @description Link containing information about a media and takes the
 *  user to that media's page.
 */
export function MediaCard({ type, size, source, ...props }: MediaCardProps) {
  return (
    <Link href={props.href} asChild>
      <Pressable
        style={{ maxWidth: size }}
        className="w-full active:opacity-75"
      >
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
 * @description Placeholder content — useful in `<FlatList />` if we want
 *  to do something special for the first item.
 */
export const PlaceholderContent: MediaCardContent = {
  href: "invalid-href",
  source: null,
  title: "",
  subtitle: "",
  type: "album",
};

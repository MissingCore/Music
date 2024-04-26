import type { Href } from "expo-router";
import { Link } from "expo-router";
import { Pressable } from "react-native";

import { TextStack } from "@/components/ui/Text";
import type { MediaImageProps } from "./MediaImage";
import { MediaImage } from "./MediaImage";

export type MediaCardContent<T> = {
  href: Href<T>;
  title: string;
  subtitle: string;
  extra?: string | null;
} & Pick<MediaImageProps, "source" | "type">;

export type MediaCardProps<T> = MediaCardContent<T> &
  Omit<MediaImageProps, "className">;

/**
 * @description Link containing information about a media and takes the
 *  user to that media's page.
 */
export function MediaCard<T>({
  type,
  size,
  source,
  ...props
}: MediaCardProps<T>) {
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

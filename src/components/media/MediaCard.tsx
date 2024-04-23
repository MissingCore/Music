import type { Href } from "expo-router";
import { Link } from "expo-router";
import { Pressable } from "react-native";

import { TextStack } from "@/components/ui/Text";
import { MediaImage } from "./MediaImage";

type Props<T> = Omit<React.ComponentProps<typeof MediaImage>, "className"> & {
  href: Href<T>;
  title: string;
  subtitle: string;
  extra?: string | null;
};

/** @description Displays an Album, Artist, Playlist, or Track card. */
export function MediaCard<T>({ type, imgSize, imgSrc, ...props }: Props<T>) {
  return (
    <Link href={props.href} asChild>
      <Pressable
        style={{ maxWidth: imgSize }}
        className="w-full active:opacity-75"
      >
        <MediaImage {...{ type, imgSize, imgSrc }} />
        <TextStack
          content={[props.title, props.subtitle, props.extra]}
          wrapperClassName="mt-0.5 px-1"
        />
      </Pressable>
    </Link>
  );
}

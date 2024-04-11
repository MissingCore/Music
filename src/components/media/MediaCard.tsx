import { View } from "react-native";

import { TextStack } from "@/components/ui/Text";
import { MediaImage } from "./MediaImage";

type Props = Omit<React.ComponentProps<typeof MediaImage>, "className"> & {
  title: string;
  subtitle: string;
  extra?: string | null;
};

/** @description Displays an Album, Artist, Playlist, or Track card. */
export function MediaCard({ type, imgSize, imgSrc, ...text }: Props) {
  return (
    <View style={{ maxWidth: imgSize }} className="w-full">
      <MediaImage {...{ type, imgSize, imgSrc }} />
      <TextStack
        content={[text.title, text.subtitle, text.extra]}
        wrapperClassName="mt-0.5 px-1"
      />
    </View>
  );
}

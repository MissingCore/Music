import type { Prettify } from "~/utils/types";
import type { MediaImage } from "./MediaImage";

export type MediaCardContent = Prettify<
  MediaImage.ImageContent & {
    /** Mainly used for `useMediaCardListPreset`. */
    id: string;
    title: string;
    description: string;
  }
>;

export type MediaCardProps = Prettify<
  MediaCardContent & { onPress: VoidFunction; size: number; className?: string }
>;

// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

import { cn } from "~/lib/style";
import { withAlpha } from "~/utils/color";
import { useColor } from "~/modules/customization/theme/core/context";
import type { MediaImageSrc } from "../blocks/media-image";
import { MediaImage } from "../blocks/media-image";
import { Ripple } from "../themed/ripple";
import { createTextStack } from "../themed/text-stack";
import { Text } from "../themed/typography";

interface ImageCardProps {
  src: MediaImageSrc;
  size: number;
  label: string;
  supporting?: string;
  onPress: VoidFunction;
  /**
   * If we apply our fake gaps for columns (`mx-0.75`). Defaults `true`.
   *
   * **Make sure to apply `-mx-0.75` to the `className` of the scroll
   * container this is in.**
   */
  columnSpacing?: boolean;
}

//#region Image Card
const CardTextStack = createTextStack({
  labelConfig: { color: "#FFF" },
  supportingConfig: { color: "#ADADAD" },
  sharedConfig: { center: true, size: "xs" },
  clamp: true,
});

export function ImageCard(props: ImageCardProps) {
  return (
    <Ripple
      pointerEvents="box-only"
      onPress={props.onPress}
      className={cn(
        "relative rounded-lg",
        props.columnSpacing !== false && "mx-0.75",
      )}
    >
      <MediaImage src={props.src} size={props.size} className="rounded-none" />
      <LinearGradient
        colors={[withAlpha("#000", 0), withAlpha("#000", 0.9)]}
        className="absolute inset-0"
      />
      <View className="absolute inset-x-0 bottom-2 min-h-8 items-center justify-center px-2">
        {props.supporting ? (
          <CardTextStack label={props.label} supporting={props.supporting} />
        ) : (
          <Text center size="xs" numberOfLines={2} color="#FFF">
            {props.label}
          </Text>
        )}
      </View>
    </Ripple>
  );
}
//#endregion

//#region Large Image Card
const LargeCardTextStack = createTextStack({
  labelConfig: { size: "sm" },
  supportingConfig: { size: "xs", color: "onSurfaceVariant" },
  sharedConfig: { center: true },
  clamp: true,
  containerClassName: "px-2 py-1",
});

export function getLargeImageCardHeight(imgSize: number) {
  return imgSize + 44;
}

export function LargeImageCard(
  props: Omit<ImageCardProps, "supporting"> & { supporting: string },
) {
  const backgroundColor = useColor("surfaceContainerLowest");
  const imgSize = props.size - 8;
  return (
    <Ripple
      pointerEvents="box-only"
      onPress={props.onPress}
      surfaceColor="surfaceContainerLowest"
      style={{ backgroundColor }}
      className={cn(
        "rounded-lg p-1",
        props.columnSpacing !== false && "mx-0.75",
      )}
    >
      <MediaImage src={props.src} size={imgSize} className="rounded-md" />
      <LargeCardTextStack label={props.label} supporting={props.supporting} />
    </Ripple>
  );
}
//#endregion

// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

import { cn } from "~/lib/style";
import { cardStyle } from "../base/card";
import { Ripple } from "../base/ripple";
import { Text } from "../base/typography";
import { createTextStack } from "../blocks/text-stack";
import type { MediaImageSrc } from "./media-image";
import { MediaImage } from "./media-image";

interface ImageCardProps {
  src: MediaImageSrc;
  size: number;
  label: string;
  supporting?: string;
  onPress: VoidFunction;
  className?: string;
}

//#region Image Card
const CardTextStack = createTextStack({
  labelConfig: { center: true, size: "xs", className: "text-white" },
  supportingConfig: { center: true, size: "xs", className: "text-[#ADADAD]" },
  clampText: true,
});

export function ImageCard(props: ImageCardProps) {
  return (
    <Ripple
      pointerEvents="box-only"
      onPress={props.onPress}
      className={cn("relative rounded-xl", props.className)}
    >
      <MediaImage src={props.src} size={props.size} />
      <LinearGradient
        colors={["#00000000", "#000000E6"]}
        pointerEvents="none"
        className="absolute inset-0"
      />
      <View className="absolute right-0 bottom-2 left-0 min-h-8 items-center justify-center px-2">
        {props.supporting ? (
          <CardTextStack label={props.label} supporting={props.supporting} />
        ) : (
          <Text center size="xs" numberOfLines={2} className="text-white">
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
  labelConfig: { center: true, size: "sm" },
  supportingConfig: { center: true, muted: true },
  clampText: true,
  wrapperClassName: "px-2",
});

export function getLargeImageCardHeight(imgSize: number) {
  return imgSize + 40;
}

export function LargeImageCard(
  props: Omit<ImageCardProps, "supporting"> & { supporting: string },
) {
  const imgSize = props.size - 8;
  return (
    <Ripple
      pointerEvents="box-only"
      onPress={props.onPress}
      className={cardStyle({
        padding: false,
        className: cn("gap-1 p-1", props.className),
      })}
    >
      <MediaImage src={props.src} size={imgSize} className="rounded-[20]" />
      <LargeCardTextStack label={props.label} supporting={props.supporting} />
    </Ripple>
  );
}
//#endregion

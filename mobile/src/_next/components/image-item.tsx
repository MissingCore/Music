// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { useColor } from "~/_next/context/theme-context";

import { getImageUri } from "~/lib/file-system";
import { cn } from "~/_next/utils/style";
import { Image } from "./primitives/image";
import { TransitionGradient } from "./gradient";
import { Ripple } from "./ripple";
import { Text } from "./typography";

interface ImageItemProps {
  artwork: string | null;
  label: string;
  supporting?: string;
  onPress: VoidFunction;
  className?: string;
}

//#region Card
export function ImageCard(props: ImageItemProps) {
  const backgroundColor = useColor("surface");
  return (
    <Ripple
      onPress={props.onPress}
      style={{ backgroundColor }}
      className={cn(
        "aspect-square size-full overflow-hidden rounded-xl",
        props.className,
      )}
    >
      <Image source={getImageUri(props.artwork)} className="size-full" />
      <TransitionGradient color="#000" className="absolute inset-0" />
      <View
        pointerEvents="none"
        className="absolute inset-x-0 bottom-2 min-h-8 items-center justify-center px-4"
      >
        <Text numberOfLines={props.supporting ? 1 : 2} center>
          {props.label}
        </Text>
        {props.supporting ? (
          <Text numberOfLines={1} center color="textMuted" size="sm">
            {props.supporting}
          </Text>
        ) : null}
      </View>
    </Ripple>
  );
}
//#endregion

//#region List Item
export function ImageListItem(props: ImageItemProps) {
  return (
    <Ripple
      onPress={props.onPress}
      className={cn("flex-row rounded-lg", props.className)}
    >
      <Image
        source={getImageUri(props.artwork)}
        className="size-14 rounded-lg"
      />
      <View className="shrink grow justify-center px-2">
        <Text numberOfLines={1}>{props.label}</Text>
        {props.supporting ? (
          <Text numberOfLines={1} color="textMuted" size="sm">
            {props.supporting}
          </Text>
        ) : null}
      </View>
    </Ripple>
  );
}
//#endregion

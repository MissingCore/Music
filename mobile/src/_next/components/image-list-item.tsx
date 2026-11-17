// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { getImageUri } from "~/lib/file-system";
import { cn } from "~/_next/utils/style";
import { Ripple } from "./ripple";
import { Text } from "./typography";
import { Image } from "./primitives/image";

interface ImageCardProps {
  artwork: string | null;
  label: string;
  supporting?: string;
  onPress: VoidFunction;
  className?: string;
}

export function ImageListItem(props: ImageCardProps) {
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

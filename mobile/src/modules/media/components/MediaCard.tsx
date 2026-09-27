// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn } from "~/lib/style";
import { Ripple } from "~/components/Base/Pressable";
import { StyledText } from "~/components/Typography/StyledText";
import type { MediaCardProps } from "./MediaCard.type";
import { MediaImage } from "./MediaImage";

//#region Media Card
/**
 * Card containing information about some media and navigate to that media's
 * page on click.
 */
export function MediaCard({
  id: _,
  title,
  description,
  onPress,
  className,
  ...imgProps
}: MediaCardProps) {
  return (
    <Ripple
      onPress={onPress}
      style={[
        { maxWidth: imgProps.size },
        //? Conditionally applying `rounded-t-full` will break the border
        //? radius applied to the bottom.
        //?   - https://github.com/tailwindlabs/tailwindcss/issues/16902#issuecomment-2692698264
        imgProps.type === "artist" && {
          borderTopStartRadius: imgProps.size / 2,
          borderTopEndRadius: imgProps.size / 2,
        },
      ]}
      // Using `grow` instead of `w-full` because only 1 item gets shown otherwise.
      className={cn("grow gap-0 rounded-t-lg", className)}
    >
      <MediaImage {...imgProps} />
      <View className="w-full px-1.5 py-1">
        <StyledText numberOfLines={1} className="text-sm">
          {title}
        </StyledText>
        <StyledText dim numberOfLines={1}>
          {description}
        </StyledText>
      </View>
    </Ripple>
  );
}
//#endregion

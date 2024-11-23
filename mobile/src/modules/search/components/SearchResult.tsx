import { View } from "react-native";

import { cn } from "@/lib/style";
import type { Prettify } from "@/utils/types";
import { Kbd, StyledText } from "@/components/Typography";
import { MediaImage } from "@/modules/media/components";

/** Displays information about a media item. */
export function SearchResult(
  props: Prettify<
    MediaImage.ImageContent & {
      title: string;
      description?: string;
      /** Element that's placed next to the title. */
      kbdLetter?: string;
      className?: string;
    }
  >,
) {
  return (
    <View
      className={cn(
        "min-h-12 flex-row items-center gap-2 pr-4",
        props.className,
      )}
    >
      {/* @ts-expect-error - These props are type-safe.*/}
      <MediaImage
        type={props.type}
        size={48}
        source={props.source}
        radius="sm"
      />
      <View className="shrink grow">
        <View className="shrink flex-row items-end gap-1">
          {props.kbdLetter ? (
            <Kbd text={props.kbdLetter} className="mb-0.5" />
          ) : undefined}
          <StyledText
            numberOfLines={1}
            className={cn("shrink grow", { "text-sm": !!props.description })}
          >
            {props.title}
          </StyledText>
        </View>
        {!!props.description && (
          <StyledText preset="dimOnCanvas" numberOfLines={1}>
            {props.description}
          </StyledText>
        )}
      </View>
    </View>
  );
}

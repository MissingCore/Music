import { View } from "react-native";

import { cn } from "~/lib/style";
import { omitKeys, pickKeys } from "~/utils/object";
import type { UniformObject } from "~/utils/types";
import type { PressProps } from "~/components/Form/Button";
import { PressPropsKeys, Ripple } from "~/components/Form/Button";
import { Kbd } from "~/components/Typography/Kbd";
import { StyledText } from "~/components/Typography/StyledText";
import { MediaImage } from "~/modules/media/components/MediaImage";
import type { MediaType } from "~/modules/media/types";

export namespace SearchResult {
  export type Content = {
    title: string;
    description?: string;
    type: MediaType;
    imageSource?: MediaImage.ImageSource | MediaImage.ImageSource[];
    /** Renders this instead of the image if provided. */
    LeftElement?: React.JSX.Element;
    className?: string;
  };

  export type Variations =
    | ({ as?: "default" } & UniformObject<
        PressProps & { wrapperClassName?: string },
        never
      >)
    | ({ as: "ripple"; wrapperClassName?: string } & PressProps);

  export type Props = Content &
    Variations & {
      /** Letter that's placed next to the title. */
      contentLabel?: string;
      RightElement?: React.JSX.Element;
    };
}

const wrapperPropsKeys = [
  ...["as", "className", "wrapperClassName"],
  ...PressPropsKeys,
] as const;

/** Displays information about a media item. */
export function SearchResult(props: SearchResult.Props) {
  const { as, className, ...rippleProps } = pickKeys(props, wrapperPropsKeys);
  const contentProps = omitKeys(props, wrapperPropsKeys);

  if (as === "ripple") {
    return (
      <Ripple {...rippleProps} className={className}>
        <SearchResultContent {...contentProps} />
      </Ripple>
    );
  }
  return (
    <View className={cn("min-h-12 flex-row items-center gap-2", className)}>
      <SearchResultContent {...contentProps} />
    </View>
  );
}

/** Content rendered in either variant of `<SearchResult />`. */
function SearchResultContent(
  props: Omit<SearchResult.Props, keyof SearchResult.Variations | "className">,
) {
  return (
    <>
      {props.LeftElement ? (
        props.LeftElement
      ) : (
        /* @ts-expect-error Things should be fine with proper usage. */
        <MediaImage
          type={props.type}
          size={48}
          source={props.imageSource ?? null}
          className="rounded-sm"
        />
      )}
      <View className="shrink grow">
        <View className="shrink flex-row items-center gap-1">
          {props.contentLabel ? <Kbd text={props.contentLabel} /> : undefined}
          <StyledText
            numberOfLines={1}
            className={cn("shrink grow", { "text-sm": !!props.description })}
          >
            {props.title}
          </StyledText>
        </View>
        {!!props.description && (
          <StyledText dim numberOfLines={1}>
            {props.description}
          </StyledText>
        )}
      </View>
      {props.RightElement}
    </>
  );
}

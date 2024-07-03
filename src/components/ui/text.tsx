import type { VariantProps } from "cva";
import { cva } from "cva";
import type { TextProps } from "react-native";
import { Text, View } from "react-native";

import { TwFontFamilies } from "@/constants/Styles";
import type { TextColor } from "@/lib/style";
import { cn } from "@/lib/style";
import type { Maybe } from "@/utils/types";

/** @description Shorthand for `<Text numberOfLines={1} />`. */
export function TextLine(props: TextProps) {
  return <Text numberOfLines={1} {...props} />;
}

/**
 * @description Design for having 2 rows of text — we can optionally
 *  display 2 pieces of text next to each other in the 2nd row.
 */
export function TextStack(props: {
  content: [string, Maybe<string>] | [string, string, Maybe<string>];
  wrapperClassName?: string;
  colors?: { row1: TextColor; row2: TextColor };
}) {
  return (
    <View className={props.wrapperClassName}>
      <TextLine
        className={cn(
          "font-geistMono text-base text-foreground50",
          props.colors?.row1,
        )}
      >
        {props.content[0]}
      </TextLine>
      <View className="flex-row gap-1">
        <TextLine
          className={cn(
            "flex-1 font-geistMonoLight text-xs text-foreground100",
            props.colors?.row2,
          )}
        >
          {props.content[1] ?? ""}
        </TextLine>
        {!!props.content[2] && (
          <TextLine
            className={cn(
              "shrink-0 font-geistMonoLight text-xs text-foreground100",
              props.colors?.row2,
            )}
          >
            {props.content[2]}
          </TextLine>
        )}
      </View>
    </View>
  );
}

/** @description Mimicking the HTML `<code>` element. */
export function Code({ text }: { text: string }) {
  return (
    <View className="shrink rounded-sm bg-surface700 px-1 py-0.5">
      <Text className="font-geistMonoLight text-xs text-surface50">{text}</Text>
    </View>
  );
}

/** @description Generic component for heading text. */
export function Heading({
  as,
  asLine,
  className,
  ...props
}: TextProps & { as: "h1" | "h2" | "h3" | "h4"; asLine?: boolean }) {
  const style = cn(
    "text-center text-foreground50",
    {
      "text-title": as === "h1",
      "text-subtitle": as === "h2",
      "text-xl": as === "h3",
      "text-lg": as === "h4",
      // Need this as `font-family` class fail to be merged.
      "font-ndot57": !TwFontFamilies?.some((fam) => className?.includes(fam)),
    },
    className,
  );

  if (asLine) return <TextLine className={style} {...props} />;
  return <Text className={style} {...props} />;
}

const description = cva({
  base: "text-center font-geistMono text-base text-foreground100",
  variants: {
    intent: {
      default: "",
      error: "text-accent50",
      setting: "text-start font-geistMonoLight text-xs text-surface400",
    },
  },
  defaultVariants: { intent: "default" },
});

/** @description Styled text for descriptive content. */
export function Description(
  props: VariantProps<typeof description> & TextProps,
) {
  const { intent, className, ...rest } = props;
  return <Text {...rest} className={cn(description({ intent }), className)} />;
}

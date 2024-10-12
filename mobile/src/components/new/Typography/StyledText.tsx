import type { VariantProps } from "cva";
import { cva } from "cva";
import type { TextProps } from "react-native";
import { Text } from "react-native";

import { cn } from "@/lib/style";

export type TextStyleProps = VariantProps<typeof textStyles>;
export const textStyles = cva({
  variants: {
    preset: {
      default: "text-base text-foreground",
      dimOnCanvas: "text-xs text-foreground/60",
      dimOnSurface: "text-xs text-foreground/50",
    },
    bold: { true: "font-robotoMedium", false: "font-roboto" },
    center: { true: "text-center", false: "" },
  },
  defaultVariants: { preset: "default", bold: false, center: false },
});

/** Styled `<Text />`. */
export function StyledText({
  className,
  preset,
  bold,
  center,
  ...rest
}: TextProps & TextStyleProps) {
  return (
    <Text
      className={cn(textStyles({ preset, bold, center }), className)}
      {...rest}
    />
  );
}

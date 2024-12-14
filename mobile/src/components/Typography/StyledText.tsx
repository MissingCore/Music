import type { TextProps } from "react-native";
import { Text } from "react-native";

import { cn } from "@/lib/style";

/** Styled `<Text />`. */
export function StyledText({
  className,
  preset,
  bold,
  center,
  ...props
}: TextProps & {
  preset?: "dimOnCanvas" | "dimOnSurface";
  bold?: boolean;
  center?: boolean;
}) {
  return (
    <Text
      className={cn(
        "text-base text-foreground",
        {
          "text-center": center,
          "text-xs": preset !== undefined,
          "text-foreground/60": preset === "dimOnCanvas",
          "text-foreground/50": preset === "dimOnSurface",
        },
        // From past experience, the font-family doesn't get replaced for some reason.
        bold ? "font-robotoMedium" : "font-roboto",
        className,
      )}
      {...props}
    />
  );
}

/** Emphasize some text. */
export function Em({
  children,
  className,
  ...props
}: Omit<React.ComponentProps<typeof StyledText>, "children"> & {
  children: string;
}) {
  return (
    <StyledText bold className={cn("text-xxs", className)} {...props}>
      {children.toLocaleUpperCase()}
    </StyledText>
  );
}

import { Link } from "expo-router";
import { forwardRef } from "react";
import type { GestureResponderEvent, View } from "react-native";
import { Pressable, Text } from "react-native";

import { cn } from "@/lib/style";
import { ExternalLink } from "@/components/navigation/ExternalLink";

const ButtonThemes = {
  "white-outline": {
    button: {
      base: "border-foreground50 active:bg-surface700",
      disabled: "border-surface500",
    },
    text: { base: "text-foreground50", disabled: "text-surface500" },
  },
  neutral: {
    button: {
      base: "border-surface500 bg-surface500 active:border-surface700 active:bg-surface700",
      disabled: "border-surface700 bg-surface700",
    },
    text: { base: "text-foreground50", disabled: "text-surface500" },
  },
  "neutral-outline": {
    button: {
      base: "border-surface500 active:bg-surface500",
      disabled: "border-surface700",
    },
    text: { base: "text-foreground50", disabled: "text-surface500" },
  },
  "neutral-alt": {
    button: {
      base: "border-surface800 bg-surface800 active:border-surface700 active:bg-surface700",
      disabled: "border-surface700 bg-surface700",
    },
    text: { base: "text-foreground50", disabled: "text-surface500" },
  },
  accent: {
    button: {
      base: "border-accent500 bg-accent500 active:border-accent50 active:bg-accent50",
      disabled: "border-surface700 bg-surface700",
    },
    text: { base: "text-foreground50", disabled: "text-surface500" },
  },
} as const;

export type ButtonProps = {
  theme?: keyof typeof ButtonThemes;
  disabled?: boolean;
  content: string;
  onPress?: (e?: GestureResponderEvent) => void;
  Icon?: React.JSX.Element;
  wrapperClassName?: string;
  textClassName?: string;
};

/** @description Pill button with icon support. */
export const Button = forwardRef<View, ButtonProps>(
  function Button(props, ref) {
    const theme = props.theme ?? "white-outline";

    return (
      <Pressable
        ref={ref}
        onPress={(e) => {
          if (!props.disabled && props.onPress) props.onPress(e);
        }}
        className={cn(
          "flex-row items-center gap-2 rounded-full border px-2 py-1",
          {
            [ButtonThemes[theme].button.base]: !props.disabled,
            [ButtonThemes[theme].button.disabled]: props.disabled,
          },
          props.wrapperClassName,
        )}
      >
        {props.Icon}
        <Text
          className={cn(
            "font-geistMono text-sm",
            {
              [ButtonThemes[theme].text.base]: !props.disabled,
              [ButtonThemes[theme].text.disabled]: props.disabled,
            },
            props.textClassName,
          )}
        >
          {props.content}
        </Text>
      </Pressable>
    );
  },
);

export type LinkButtonProps = ButtonProps & { as?: "external"; href: string };

/** @description Render `<Button />` as a link. */
export function LinkButton({ as, href, ...rest }: LinkButtonProps) {
  return as === "external" ? (
    <ExternalLink href={href} asChild>
      <Button {...rest} />
    </ExternalLink>
  ) : (
    <Link href={href} asChild>
      <Button {...rest} />
    </Link>
  );
}

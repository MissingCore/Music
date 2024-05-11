import { Link } from "expo-router";
import { forwardRef } from "react";
import type { GestureResponderEvent, View } from "react-native";
import { Pressable, Text } from "react-native";

import { cn } from "@/lib/style";
import type { Prettify } from "@/utils/types";
import { ExternalLink } from "../navigation/ExternalLink";

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

export type ButtonProps = Prettify<
  ButtonContentProps &
    (
      | { type?: "button"; href?: never }
      | { type: "link" | "external-link"; href: string }
    )
>;

/** @description Custom pill button with icon support. */
export function Button({ type, href, ...rest }: ButtonProps) {
  if (!type || type === "button") {
    return <ButtonContent {...rest} />;
  } else if (type === "link") {
    return (
      <Link href={href} asChild>
        <ButtonContent {...rest} />
      </Link>
    );
  } else if (type === "external-link") {
    return (
      <ExternalLink href={href} asChild>
        <ButtonContent {...rest} />
      </ExternalLink>
    );
  }
  throw new Error("Invalid type.");
}

type ButtonContentProps = {
  theme?: keyof typeof ButtonThemes;
  disabled?: boolean;
  content: string;
  onPress?: (e?: GestureResponderEvent) => void;
  Icon?: React.JSX.Element;
  wrapperClassName?: string;
  textClassName?: string;
};

/** @description Custom pill button. */
export const ButtonContent = forwardRef<View, ButtonContentProps>(
  (props, ref) => {
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

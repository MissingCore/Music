import type { VariantProps } from "cva";
import { cva } from "cva";
import { Link } from "expo-router";
import { forwardRef } from "react";
import type { PressableProps, View } from "react-native";
import { Pressable, Text } from "react-native";

import { cn } from "@/lib/style";
import { ExternalLink } from "../navigation/external-link";

// FIXME: Currently hard-coded color values — need to revist when we do themes.
const button = cva({
  base: [
    `[--txt-clr:#F0F2F2]`,
    "items-center rounded-full border p-2",
    "active:opacity-75 disabled:opacity-25",
  ],
  variants: {
    variant: {
      solid: "border-[var(--btn-clr)] bg-[var(--btn-clr)]",
      outline: "border-[var(--btn-clr)] [--txt-clr:var(--btn-clr)]",
    },
    theme: {
      white: `[--btn-clr:#F0F2F2]`,
      neutral: `[--btn-clr:#484949]`,
      "neutral-dark": `[--btn-clr:#1B1D1F]`,
      accent: `[--btn-clr:#D71921]`,
    },
  },
  compoundVariants: [
    { variant: "solid", theme: "white", class: `[--txt-clr:#1B1D1F]` },
  ],
  defaultVariants: { variant: "solid", theme: "white" },
});

export namespace Button {
  type Interactions =
    | { interaction?: "button"; href?: never }
    | { interaction: "link" | "external-link"; href: string };

  export type Props = VariantProps<typeof button> &
    Interactions & {
      children: React.ReactNode;
      disabled?: boolean;
      onPress?: PressableProps["onPress"];
      Icon?: React.JSX.Element;
      wrapperClassName?: string;
      textClassName?: string;
    };
}

/** Pill button with icon support. */
export function Button({
  interaction = "button",
  href,
  ...props
}: Button.Props) {
  if (interaction === "button") {
    return <ButtonBase {...props} />;
  } else if (interaction === "link") {
    return (
      <Link href={href!} asChild>
        <ButtonBase {...props} />
      </Link>
    );
  } else if (interaction === "external-link") {
    return (
      <ExternalLink href={href!} asChild>
        <ButtonBase {...props} />
      </ExternalLink>
    );
  }
}

const ButtonBase = forwardRef<View, Omit<Button.Props, "interaction" | "href">>(
  function ButtonBase({ theme, variant, ...props }, ref) {
    return (
      <Pressable
        ref={ref}
        disabled={props.disabled}
        onPress={(e) => (props.onPress ? props.onPress(e) : undefined)}
        className={cn(
          button({ theme, variant }),
          { "flex-row gap-2": !!props.Icon },
          props.wrapperClassName,
        )}
      >
        {props.Icon}
        <Text
          className={cn(
            "font-geistMono text-sm text-[--txt-clr]",
            props.textClassName,
          )}
        >
          {props.children}
        </Text>
      </Pressable>
    );
  },
);

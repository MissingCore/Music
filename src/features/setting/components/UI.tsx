import Ionicons from "@expo/vector-icons/Ionicons";
import { Link as ExpoLink } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ArrowRight } from "@/assets/svgs/ArrowRight";
import { OpenInNewOutline } from "@/assets/svgs/MaterialSymbol";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { ExternalLink } from "@/components/navigation/ExternalLink";
import { Heading } from "@/components/ui/text";

type UIProp = { className?: string; children: React.ReactNode };

/**
 * @description Link to a submenu within the `/setting` route. `href`
 *  **should not** start with a `/`.
 */
export function SubMenuLink({
  href,
  label,
}: {
  /** **Should not** start with a `/`. */
  href: string;
  label: string;
}) {
  return (
    <ExpoLink href={`/setting/${href}`} asChild>
      <Pressable className="mb-6 flex-row items-center justify-between gap-2 active:opacity-75">
        <Title>{label}</Title>
        <ArrowRight size={24} color={Colors.surface400} />
      </Pressable>
    </ExpoLink>
  );
}

/**  @description A styled link for `/setting` pages. Defaults to an external link. */
export function Link({
  href,
  iconName,
  label,
  external = true,
}: {
  href: string;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  external?: boolean;
}) {
  const LinkType = external ? ExternalLink : ExpoLink;

  return (
    <LinkType href={href} asChild>
      <Pressable className="mb-6 flex-row items-center justify-between gap-2 active:opacity-75">
        <View className="shrink flex-row gap-2">
          {!!iconName && (
            <Ionicons name={iconName} color={Colors.foreground50} size={24} />
          )}
          <Title>{label}</Title>
        </View>
        <OpenInNewOutline size={24} color={Colors.surface400} />
      </Pressable>
    </LinkType>
  );
}

/** @description `<View />` with default bottom margin for consistency. */
export function Section({ className, children }: UIProp) {
  return <View className={cn("mb-6", className)}>{children}</View>;
}

/** @description Pre-styled `<Heading />` used in `/setting` pages. */
export function Title({ className, children }: UIProp) {
  return (
    <Heading
      as="h4"
      className={cn(
        "shrink text-start font-geistMono tracking-wider text-foreground100",
        className,
      )}
    >
      {children}
    </Heading>
  );
}

/** @description Styling for muted text on `/setting` pages. */
export function Description({ className, children }: UIProp) {
  return (
    <Text
      className={cn("font-geistMonoLight text-sm text-surface400", className)}
    >
      {children}
    </Text>
  );
}

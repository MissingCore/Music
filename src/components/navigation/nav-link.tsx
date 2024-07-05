import { Link } from "expo-router";
import { Text, View } from "react-native";

import { ArrowRight } from "@/assets/svgs/ArrowRight";
import { OpenInNewOutline } from "@/assets/svgs/MaterialSymbol";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { ExternalLink } from "./external-link";
import { StyledPressable } from "../ui/pressable";

export namespace NavLink {
  export type Props = { href: string; label: string; external?: boolean };
}

/**
 * @description Link user to another page or an external page with an helpful
 *  indicator icon.
 */
export function NavLink(props: NavLink.Props) {
  const { href, label, external } = props;
  const LinkType = external ? ExternalLink : Link;
  const NavIcon = external ? OpenInNewOutline : ArrowRight;

  return (
    <LinkType href={href} asChild>
      <StyledPressable className="flex-row items-center justify-between gap-2 pl-4">
        <NavLinkLabel className="py-1">{label}</NavLinkLabel>
        <View className="pointer-events-none p-3">
          <NavIcon size={24} color={Colors.surface400} />
        </View>
      </StyledPressable>
    </LinkType>
  );
}

export namespace NavLinkLabel {
  export type Props = { children: React.ReactNode; className?: string };
}

/** @description Reusable label component for `<NavLink />`. */
export function NavLinkLabel(props: NavLinkLabel.Props) {
  return (
    <Text
      className={cn(
        "shrink font-geistMonoLight text-sm tracking-wider text-foreground50",
        props.className,
      )}
    >
      {props.children}
    </Text>
  );
}

export namespace NavLinkGroup {
  export type Props = {
    name: string;
    links: NavLink.Props[];
    listClassName?: string;
  };
}

/** @description List out a group of `<NavLink />`. */
export function NavLinkGroup(props: NavLinkGroup.Props) {
  return (
    <>
      <NavLinkGroupHeading>{props.name}</NavLinkGroupHeading>
      <View className={cn("gap-1", props.listClassName)}>
        {props.links.map((linkProps) => (
          <NavLink key={linkProps.href} {...linkProps} />
        ))}
      </View>
    </>
  );
}

export namespace NavLinkGroupHeading {
  export type Props = { children: React.ReactNode; className?: string };
}

/** @description Reusable heading component for `<NavLinkGroup />`. */
export function NavLinkGroupHeading(props: NavLinkGroupHeading.Props) {
  return (
    <Text
      className={cn(
        "mb-2 font-geistMono text-xs tracking-widest text-surface400",
        props.className,
      )}
    >
      {props.children}
    </Text>
  );
}

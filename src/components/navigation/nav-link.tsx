import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";

import { ArrowRight } from "@/assets/svgs/ArrowRight";
import { OpenInNewOutline } from "@/assets/svgs/MaterialSymbol";

import { Colors } from "@/constants/Styles";
import { ExternalLink } from "./external-link";
import { Title } from "../ui/text";

export namespace NavLink {
  export type Props = {
    href: string;
    label: string;
    iconName?: React.ComponentProps<typeof Ionicons>["name"];
    external?: boolean;
  };
}

/**
 * @description Link user to another page or an external page with an helpful
 *  indicator icon. Can optionally prepend an icon to the component.
 */
export function NavLink(props: NavLink.Props) {
  const { href, label, external, iconName } = props;
  const LinkType = external ? ExternalLink : Link;
  const NavIcon = external ? OpenInNewOutline : ArrowRight;

  return (
    <LinkType href={href} asChild>
      <Pressable className="mb-6 flex-row items-center justify-between gap-2 active:opacity-75">
        <View className="shrink flex-row gap-2">
          {!!iconName && (
            <Ionicons name={iconName} color={Colors.foreground50} size={24} />
          )}
          <Title>{label}</Title>
        </View>
        <NavIcon size={24} color={Colors.surface400} />
      </Pressable>
    </LinkType>
  );
}

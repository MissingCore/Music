import { getHeaderTitle } from "@react-navigation/elements";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { useNavigation } from "expo-router";
import { Text, View } from "react-native";

import { cn } from "@/lib/style";
import { BackButton } from "./back";
import { SafeContainer } from "../ui/container";

/**
 * Override React Navigation's default header to account for tap-target
 * size.
 */
export function CustomHeader(props: NativeStackHeaderProps) {
  return (
    <ReusableHeaderBase
      {...props}
      TitleWrapper={(props: { children: React.ReactNode }) => (
        <Text
          numberOfLines={1}
          className="flex-1 shrink font-ndot text-title text-foreground50"
        >
          {props.children}
        </Text>
      )}
    />
  );
}

/** Custom navigation header for `/current-track` route. */
export function CurrentTrackHeader(props: NativeStackHeaderProps) {
  return (
    <ReusableHeaderBase
      {...props}
      TitleWrapper={(props: { children: React.ReactNode }) => (
        <Text
          numberOfLines={2}
          className="mx-auto max-w-56 flex-1 text-center font-geistMono text-sm text-foreground50"
        >
          {props.children}
        </Text>
      )}
    />
  );
}

namespace ReusableHeaderBase {
  export type Props = NativeStackHeaderProps & {
    TitleWrapper: (props: { children: React.ReactNode }) => React.ReactNode;
  };
}

/**
 * Override React Navigation's default header to account for tap-target
 * size. Requires a wrapper for the title.
 */
export function ReusableHeaderBase({
  route,
  options,
  TitleWrapper,
}: ReusableHeaderBase.Props) {
  const title = getHeaderTitle(options, route.name);
  const navigation = useNavigation();

  const canGoBack = navigation.canGoBack() && title !== "MUSIC";

  return (
    <SafeContainer className="bg-canvas">
      <View
        className={cn("h-14 flex-row items-center gap-4 p-1", {
          "pl-4": !canGoBack,
          "pr-4": !options.headerRight,
        })}
      >
        {canGoBack && <BackButton />}
        <TitleWrapper>{title}</TitleWrapper>
        {!!options.headerRight && options.headerRight({ canGoBack })}
      </View>
    </SafeContainer>
  );
}

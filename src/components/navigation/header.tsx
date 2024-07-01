import { getHeaderTitle } from "@react-navigation/elements";
import type { Stack } from "expo-router";
import { useSetAtom } from "jotai";
import { Pressable, Text, View } from "react-native";

import { EllipsisVertical } from "@/assets/svgs/EllipsisVertical";
import { modalAtom } from "@/features/modal/store";

import { BackButton } from "./back";
import { SafeContainer } from "../ui/container";

/*
  Manually extract `NativeStackHeaderProps` from `<Stack.Screen />` instead
  of installing `@react-navigation/native-stack` just for the type.
*/
type HeaderOption = Required<
  Pick<
    NonNullable<React.ComponentProps<typeof Stack.Screen>["options"]>,
    "header"
  >
>;
type HeaderFnSignature = HeaderOption[keyof HeaderOption];
type NativeStackHeaderProps = Parameters<HeaderFnSignature>[0];

/** @description Custom navigation header for `/current-track` route. */
export function Header({ route, options }: NativeStackHeaderProps) {
  const title = getHeaderTitle(options, route.name);
  const openModal = useSetAtom(modalAtom);

  return (
    <SafeContainer className="bg-canvas">
      <View className="flex h-14 flex-row items-center justify-between gap-8 px-4">
        <BackButton unstyled />
        <Text
          numberOfLines={2}
          className="max-w-56 flex-1 text-center font-geistMono text-sm text-foreground50"
        >
          {title}
        </Text>
        <Pressable
          accessibilityLabel="View track settings."
          onPress={() => openModal({ entity: "track", scope: "current" })}
          className="active:opacity-75"
        >
          <EllipsisVertical size={24} />
        </Pressable>
      </View>
    </SafeContainer>
  );
}

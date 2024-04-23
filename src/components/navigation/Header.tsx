import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { getHeaderTitle } from "@react-navigation/elements";
import { useSetAtom } from "jotai";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EllipsisVertical } from "@/assets/svgs/EllipsisVertical";
import { modalConfigAtom } from "@/features/modal/store";

import { UnstyledBackButton } from "@/components/navigation/BackButton";

/** @description Custom navigation header for `/current-track` route. */
export function Header({ route, options }: NativeStackHeaderProps) {
  const title = getHeaderTitle(options, route.name);
  const insets = useSafeAreaInsets();
  const openModal = useSetAtom(modalConfigAtom);

  return (
    <View style={{ paddingTop: insets.top }}>
      <View className="flex h-14 flex-row items-center justify-between gap-8 px-4">
        <UnstyledBackButton />
        <Text
          numberOfLines={2}
          className="max-w-56 flex-1 text-center font-geistMono text-sm text-foreground50"
        >
          {title}
        </Text>
        <Pressable
          onPress={() => openModal({ type: "current-track" })}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <EllipsisVertical size={24} />
        </Pressable>
      </View>
    </View>
  );
}

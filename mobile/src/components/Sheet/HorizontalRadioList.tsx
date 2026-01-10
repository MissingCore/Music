import { Pressable, View } from "react-native";

import { cn } from "~/lib/style";
import { FlatList } from "../Defaults";

export function HorizontalRadioList<T extends string>(props: {
  data: readonly T[];
  selected: T;
  onPress: (data: T) => void;
  renderPreview: (data: T) => React.ReactNode;
  renderLabel: (data: T) => React.ReactNode;
}) {
  return (
    <FlatList
      accessibilityRole="radiogroup"
      horizontal
      data={props.data}
      keyExtractor={(item) => item}
      renderItem={({ item }) => {
        const selected = props.selected === item;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => props.onPress(item)}
            disabled={selected}
            className={cn(
              "w-21 items-center gap-2 rounded-sm border border-transparent p-2 active:opacity-50",
              { "border-primary": selected },
            )}
          >
            <View className="size-16 items-center justify-center overflow-hidden rounded-sm">
              {props.renderPreview(item)}
            </View>
            <View className="min-h-6 shrink grow items-center justify-center">
              {props.renderLabel(item)}
            </View>
          </Pressable>
        );
      }}
      className="-mx-4"
      contentContainerClassName="gap-4 px-4"
    />
  );
}

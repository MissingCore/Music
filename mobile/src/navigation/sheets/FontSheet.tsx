import { Pressable, Text, View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { cn, getFont } from "~/lib/style";
import { toLowerCase } from "~/utils/string";
import { FlatList } from "~/components/Defaults";
import type { TrueSheetRef } from "~/components/Sheet";
import { DetachedSheet } from "~/components/Sheet/Detached";
import type { AccentFont } from "~/stores/Preference/constants";
import {
  AccentFontOptions,
  PrimaryFontOptions,
} from "~/stores/Preference/constants";

export function AccentFontSheet(props: { ref: TrueSheetRef }) {
  const accentFont = usePreferenceStore((s) => s.accentFont);
  return (
    <FontSheet
      ref={props.ref}
      kind="Accent"
      selectedFont={accentFont}
      fontOptions={AccentFontOptions}
      updateFont={PreferenceSetters.setAccentFont}
    />
  );
}

export function PrimaryFontSheet(props: { ref: TrueSheetRef }) {
  const primaryFont = usePreferenceStore((s) => s.primaryFont);
  return (
    <FontSheet
      ref={props.ref}
      kind="Primary"
      selectedFont={primaryFont}
      fontOptions={PrimaryFontOptions}
      updateFont={PreferenceSetters.setPrimaryFont}
    />
  );
}

function FontSheet<T extends AccentFont>(props: {
  ref: TrueSheetRef;
  kind: "Accent" | "Primary";
  selectedFont: T;
  fontOptions: readonly T[];
  updateFont: (newFont: T) => void;
}) {
  return (
    <DetachedSheet
      ref={props.ref}
      titleKey={`feat.font.extra.${toLowerCase(props.kind)}`}
    >
      <FlatList
        accessibilityRole="radiogroup"
        horizontal
        data={props.fontOptions}
        keyExtractor={(font) => font}
        renderItem={({ item: font }) => {
          const selected = props.selectedFont === font;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => props.updateFont(font)}
              disabled={selected}
              className={cn(
                "w-21 items-center gap-1 rounded-sm border border-transparent p-2",
                { "border-red": selected },
              )}
            >
              <View aria-hidden className="size-16 items-center justify-center">
                <Text
                  style={{ fontFamily: getFont(font) }}
                  className="text-center text-5xl text-foreground"
                >
                  Aa
                </Text>
              </View>
              <View className="shrink grow items-center justify-center">
                <Text
                  style={{ fontFamily: getFont(font) }}
                  className="text-center text-xs leading-tight text-foreground"
                >
                  {font}
                </Text>
              </View>
            </Pressable>
          );
        }}
        className="-mx-4"
        contentContainerClassName="gap-4 px-4"
      />
    </DetachedSheet>
  );
}

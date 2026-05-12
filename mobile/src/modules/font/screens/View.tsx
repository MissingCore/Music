import { useMemo } from "react";
import { View } from "react-native";

import { Check } from "~/resources/icons/Check";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { cn } from "~/lib/style";
import { FlatList } from "~/components/Base/List";
import { Pressable } from "~/components/Base/Pressable";
import { StyledText } from "~/components/Typography/StyledText";
import type { Font } from "../constants";
import { BundledFontOptions } from "../constants";
import { useCustomFonts } from "../queries";
import {
  areFontEqual,
  getFont,
  getFontDisplayName,
  isBundledFont,
} from "../utils";

export function AccentFonts() {
  const accentFont = usePreferenceStore((s) => s.accentFont);
  return (
    <FontsScreenBase
      kind="Accent"
      selectedFont={accentFont}
      updateFont={PreferenceSetters.setAccentFont}
    />
  );
}

export function PrimaryFonts() {
  const primaryFont = usePreferenceStore((s) => s.primaryFont);
  return (
    <FontsScreenBase
      kind="Primary"
      selectedFont={primaryFont}
      updateFont={PreferenceSetters.setPrimaryFont}
    />
  );
}

function FontsScreenBase(props: {
  kind: "Accent" | "Primary";
  selectedFont: Font;
  updateFont: (newFont: Font) => void;
}) {
  const { isPending, data } = useCustomFonts();

  const fontOptions = useMemo(() => {
    if (!data) return BundledFontOptions;
    return [...BundledFontOptions, ...data];
  }, [data]);

  const headline = props.kind === "Accent";

  if (isPending) return <PagePlaceholder isPending={isPending} />;
  return (
    <FlatList
      data={fontOptions}
      keyExtractor={(font) => (isBundledFont(font) ? font : font.id)}
      renderItem={({ item: font, index }) => {
        const selected = areFontEqual(props.selectedFont, font);
        return (
          <Pressable
            onPress={() => props.updateFont(font)}
            className={cn(
              "min-h-14 flex-row items-center gap-2 rounded-md bg-surfaceContainerLowest p-2 pl-4 active:opacity-75",
              {
                "mt-0.75 rounded-t-xs": index > 0,
                "rounded-b-xs": index < fontOptions.length - 1,
              },
            )}
          >
            <View
              className={cn(
                "size-5 items-center justify-center rounded-full border border-onSurface",
                { "border-0 bg-onSurface": selected },
              )}
            >
              {selected ? <Check size={18} color="surface" /> : null}
            </View>
            <StyledText
              style={{ fontFamily: getFont(font, { headline }) }}
              className="shrink grow"
            >
              {getFontDisplayName(font)}
            </StyledText>
          </Pressable>
        );
      }}
      contentContainerClassName="p-4"
    />
  );
}

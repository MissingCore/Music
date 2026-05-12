import { Text } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { toLowerCase } from "~/utils/string";
import { DetachedSheet } from "~/components/Sheet";
import { HorizontalRadioList } from "~/components/Sheet/HorizontalRadioList";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import type { Font } from "~/modules/font/constants";
import { BundledFontOptions } from "~/modules/font/constants";
import { getFont, isBundledFont } from "~/modules/font/utils";

export function AccentFontSheet(props: { ref: TrueSheetRef }) {
  const accentFont = usePreferenceStore((s) => s.accentFont);
  return (
    <FontSheet
      ref={props.ref}
      kind="Accent"
      selectedFont={accentFont}
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
      updateFont={PreferenceSetters.setPrimaryFont}
    />
  );
}

function FontSheet(props: {
  ref: TrueSheetRef;
  kind: "Accent" | "Primary";
  selectedFont: Font;
  updateFont: (newFont: Font) => void;
}) {
  const headline = props.kind === "Accent";
  const selectedBundledFont = isBundledFont(props.selectedFont)
    ? props.selectedFont
    : "Roboto";

  return (
    <DetachedSheet
      ref={props.ref}
      titleKey={`feat.font.extra.${toLowerCase(props.kind)}`}
    >
      <HorizontalRadioList
        data={BundledFontOptions}
        selected={selectedBundledFont}
        onPress={(font) => props.updateFont(font)}
        renderPreview={(font) => (
          <Text
            style={{ fontFamily: getFont(font, { headline }) }}
            className="text-center text-5xl text-onSurface"
          >
            Aa
          </Text>
        )}
        renderLabel={(font) => (
          <Text
            style={{ fontFamily: getFont(font, { headline }) }}
            className="text-center text-xs leading-tight text-onSurface"
          >
            {font}
          </Text>
        )}
      />
    </DetachedSheet>
  );
}

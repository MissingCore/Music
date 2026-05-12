import { Text } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { getFont } from "~/lib/style";
import { toLowerCase } from "~/utils/string";
import { DetachedSheet } from "~/components/Sheet";
import { HorizontalRadioList } from "~/components/Sheet/HorizontalRadioList";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import type { BundledFont } from "~/modules/font/constants";
import { BundledFontOptions } from "~/modules/font/constants";

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
  selectedFont: BundledFont;
  updateFont: (newFont: BundledFont) => void;
}) {
  const headline = props.kind === "Accent";
  return (
    <DetachedSheet
      ref={props.ref}
      titleKey={`feat.font.extra.${toLowerCase(props.kind)}`}
    >
      <HorizontalRadioList
        data={BundledFontOptions}
        selected={props.selectedFont}
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

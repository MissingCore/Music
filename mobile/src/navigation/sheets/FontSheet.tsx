import { Text } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { getFont } from "~/lib/style";
import { toLowerCase } from "~/utils/string";
import { DetachedSheet } from "~/components/Sheet/Detached";
import { HorizontalRadioList } from "~/components/Sheet/HorizontalRadioList";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
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
      <HorizontalRadioList
        data={props.fontOptions}
        selected={props.selectedFont}
        onPress={(font) => props.updateFont(font)}
        renderPreview={(font) => (
          <Text
            style={{ fontFamily: getFont(font) }}
            className="text-center text-5xl text-onSurface"
          >
            Aa
          </Text>
        )}
        renderLabel={(font) => (
          <Text
            style={{ fontFamily: getFont(font) }}
            className="text-center text-xs leading-tight text-onSurface"
          >
            {font}
          </Text>
        )}
      />
    </DetachedSheet>
  );
}

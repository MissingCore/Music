import { Text } from "react-native";

import {
  AccentFontOptions,
  PrimaryFontOptions,
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";

import { getFont } from "~/lib/style";
import { toLowerCase } from "~/utils/string";
import { FlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import { Sheet } from "~/components/Sheet";

//#region Accent Font
/** Sheet allowing us to change the app's accent font. */
export function FontAccentSheet() {
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  return (
    <FontSheet
      kind="Accent"
      selectedFont={accentFont}
      fontOptions={AccentFontOptions}
      updateFont={setAccentFont}
    />
  );
}
//#endregion

//#region Primary Font
/** Sheet allowing us to change the app's primary font. */
export function FontPrimarySheet() {
  const primaryFont = useUserPreferencesStore((state) => state.primaryFont);
  return (
    <FontSheet
      kind="Primary"
      selectedFont={primaryFont}
      fontOptions={PrimaryFontOptions}
      updateFont={setPrimaryFont}
    />
  );
}
//#endregion

//#region Base Font Sheet
function FontSheet<T extends (typeof AccentFontOptions)[number]>(props: {
  kind: "Accent" | "Primary";
  selectedFont: T;
  fontOptions: readonly T[];
  updateFont: (newFont: T) => void;
}) {
  return (
    <Sheet
      id={`Font${props.kind}Sheet`}
      titleKey={`feat.font.extra.${toLowerCase(props.kind)}`}
    >
      <FlatList
        accessibilityRole="radiogroup"
        data={props.fontOptions}
        keyExtractor={(font) => font}
        renderItem={({ item: font }) => (
          <Radio
            selected={props.selectedFont === font}
            onSelect={() => props.updateFont(font)}
          >
            <Text
              className="text-base leading-tight text-foreground"
              style={{ fontFamily: getFont(font) }}
            >
              {font}
            </Text>
          </Radio>
        )}
        contentContainerClassName="gap-1"
      />
    </Sheet>
  );
}
//#endregion

//#region Setter functions.
const setAccentFont = (newFont: (typeof AccentFontOptions)[number]) =>
  userPreferencesStore.setState({ accentFont: newFont });

const setPrimaryFont = (newFont: (typeof PrimaryFontOptions)[number]) =>
  userPreferencesStore.setState({ primaryFont: newFont });
//#endregion

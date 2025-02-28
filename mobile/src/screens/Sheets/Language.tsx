import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { LANGUAGES } from "~/modules/i18n/constants";

import { SheetsFlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import { Sheet } from "~/components/Sheet";
import { StyledText } from "~/components/Typography/StyledText";

/** Sheet allowing us to change the app's language. */
export default function LanguageSheet() {
  const languageCode = useUserPreferencesStore((state) => state.language);
  return (
    <Sheet
      id="LanguageSheet"
      titleKey="feat.language.title"
      contentContainerClassName="pb-0"
    >
      <SheetsFlatList
        accessibilityRole="radiogroup"
        data={LANGUAGES}
        keyExtractor={({ code }) => code}
        renderItem={({ item }) => (
          <Radio
            selected={item.code === languageCode}
            onSelect={() => setLanguage(item.code)}
          >
            <StyledText>{item.name}</StyledText>
          </Radio>
        )}
        contentContainerClassName="gap-1 pb-4"
      />
    </Sheet>
  );
}

const setLanguage = (languageCode: string) =>
  userPreferencesStore.setState({ language: languageCode });

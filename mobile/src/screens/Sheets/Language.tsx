import { useUserPreferencesStore } from "@/services/UserPreferences";
import { LANGUAGES } from "@/modules/i18n/constants";

import { SheetsFlatList } from "@/components/Defaults";
import { Radio } from "@/components/Form/Selection";
import { Sheet } from "@/components/Sheet";
import { StyledText } from "@/components/Typography/StyledText";

/** Sheet allowing us to change the app's language. */
export default function LanguageSheet() {
  const languageCode = useUserPreferencesStore((state) => state.language);
  const setLanguage = useUserPreferencesStore((state) => state.setLanguage);

  return (
    <Sheet
      id="LanguageSheet"
      titleKey="title.language"
      contentContainerClassName="pb-0"
    >
      <SheetsFlatList
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

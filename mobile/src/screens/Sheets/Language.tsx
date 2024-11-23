import { useTranslation } from "react-i18next";
import type { SheetProps } from "react-native-actions-sheet";
import { FlatList } from "react-native-actions-sheet";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { LANGUAGES } from "@/modules/i18n/constants";

import { Radio } from "@/components/Form";
import { Sheet } from "@/components/Sheet";
import { StyledText } from "@/components/Typography";

/** Sheet allowing us to change the app's language. */
export default function LanguageSheet(props: SheetProps<"language-sheet">) {
  const { t } = useTranslation();
  const languageCode = useUserPreferencesStore((state) => state.language);
  const setLanguage = useUserPreferencesStore((state) => state.setLanguage);

  return (
    <Sheet
      id={props.sheetId}
      title={t("title.language")}
      contentContainerClassName="pb-0"
    >
      <FlatList
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
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-1 pb-4"
      />
    </Sheet>
  );
}

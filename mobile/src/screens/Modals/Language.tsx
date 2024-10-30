import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { LANGUAGES } from "@/modules/i18n/constants";

import { Radio } from "@/components/new/Form";
import { ModalHeader, ModalSheet } from "@/components/new/Modal";
import { StyledText } from "@/components/new/Typography";

/** Modal to change the app's language. */
export const LanguageModal = forwardRef<BottomSheetModal, {}>(
  function LanguageModal(_props, ref) {
    const { t } = useTranslation();
    const languageCode = useUserPreferencesStore((state) => state.language);
    const setLanguage = useUserPreferencesStore((state) => state.setLanguage);

    return (
      <ModalSheet ref={ref}>
        <BottomSheetFlatList
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
          // Sticky the modal header as otherwise, it will scroll with the content.
          stickyHeaderIndices={[0]}
          ListHeaderComponent={<ModalHeader title={t("title.language")} />}
          contentContainerClassName="gap-1 pb-4"
        />
      </ModalSheet>
    );
  },
);

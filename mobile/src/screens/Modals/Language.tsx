import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { useTheme } from "@/hooks/useTheme";
import { LANGUAGES } from "@/modules/i18n/constants";

import { cn } from "@/lib/style";
import { ModalHeader, ModalSheet } from "@/components/new/Modal";
import { StyledText } from "@/components/new/Typography";

/** Modal to change the app's language. */
export const LanguageModal = forwardRef<BottomSheetModal, {}>(
  function LanguageModal(_props, ref) {
    const { t } = useTranslation();
    const languageCode = useUserPreferencesStore((state) => state.language);
    const setLanguage = useUserPreferencesStore((state) => state.setLanguage);
    const { surface } = useTheme();

    return (
      <ModalSheet ref={ref}>
        <BottomSheetFlatList
          data={LANGUAGES}
          keyExtractor={({ code }) => code}
          renderItem={({ item }) => (
            <View className="overflow-hidden rounded-md">
              <Pressable
                android_ripple={{ color: surface }}
                onPress={() => setLanguage(item.code)}
                disabled={item.code === languageCode}
                className={cn("min-h-12 justify-center p-4", {
                  "bg-surface": item.code === languageCode,
                })}
              >
                <StyledText>{item.name}</StyledText>
              </Pressable>
            </View>
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

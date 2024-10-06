import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { useTheme } from "@/hooks/useTheme";
import { LANGUAGES } from "@/modules/i18n/constants";

import { cn } from "@/lib/style";
import { ModalSheet } from "@/components/new/Modal";
import { StyledText } from "@/components/new/Typography";

/** Modal to change the app's language. */
export const LanguageModal = forwardRef<BottomSheetModal, {}>(
  function LanguageModal(_props, ref) {
    const { t } = useTranslation();
    const languageCode = useUserPreferencesStore((state) => state.language);
    const setLanguage = useUserPreferencesStore((state) => state.setLanguage);
    const { surface } = useTheme();

    return (
      <ModalSheet ref={ref} title={t("title.language")}>
        <FlatList
          // Use a `<FlatList />` instead of a `<FlashList />` as the
          // children should always rerender whenever the language changes.
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
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-1 pb-4"
        />
      </ModalSheet>
    );
  },
);

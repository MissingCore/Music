import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, View } from "react-native";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";
import { ModalHeader, ModalSheet } from "@/components/new/Modal";
import { StyledText } from "@/components/new/Typography";

/** Modal to change the app's theme. */
export const ThemeModal = forwardRef<BottomSheetModal, {}>(
  function ThemeModal(_props, ref) {
    const { t } = useTranslation();
    const { setColorScheme } = useColorScheme();
    const theme = useUserPreferencesStore((state) => state.theme);
    const setTheme = useUserPreferencesStore((state) => state.setTheme);
    const { surface } = useTheme();

    return (
      <ModalSheet ref={ref} enableOverDrag={false}>
        <BottomSheetView className="gap-1">
          <ModalHeader title={t("title.theme")} noBg />
          <FlatList
            data={["light", "dark", "system"] as const}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <View className="overflow-hidden rounded-md">
                <Pressable
                  android_ripple={{ color: surface }}
                  onPress={() => {
                    setColorScheme(item);
                    setTheme(item);
                  }}
                  disabled={item === theme}
                  className={cn("min-h-12 justify-center p-4", {
                    "bg-surface": item === theme,
                  })}
                >
                  <StyledText>{t(`settings.related.${item}`)}</StyledText>
                </Pressable>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-1 pb-3"
          />
        </BottomSheetView>
      </ModalSheet>
    );
  },
);

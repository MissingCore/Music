import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";

import { useUserPreferencesStore } from "@/services/UserPreferences";

import { Radio } from "@/components/new/Form";
import { ModalHeader, ModalSheet } from "@/components/new/Modal";
import { StyledText } from "@/components/new/Typography";

/** Modal to change the app's theme. */
export const ThemeModal = forwardRef<BottomSheetModal, {}>(
  function ThemeModal(_props, ref) {
    const { t } = useTranslation();
    const { setColorScheme } = useColorScheme();
    const theme = useUserPreferencesStore((state) => state.theme);
    const setTheme = useUserPreferencesStore((state) => state.setTheme);

    return (
      <ModalSheet ref={ref} enableOverDrag={false}>
        <BottomSheetView className="gap-1">
          <ModalHeader title={t("title.theme")} noBg />
          <FlatList
            data={["light", "dark", "system"] as const}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Radio
                selected={item === theme}
                onSelect={() => {
                  setColorScheme(item);
                  setTheme(item);
                }}
              >
                <StyledText>{t(`settings.related.${item}`)}</StyledText>
              </Radio>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-1 pb-3"
          />
        </BottomSheetView>
      </ModalSheet>
    );
  },
);

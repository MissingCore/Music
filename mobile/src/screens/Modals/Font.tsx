import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";
import { ModalHeader, ModalSheet } from "@/components/new/Modal";

/** Modal to change the app's accent font. */
export const FontModal = forwardRef<BottomSheetModal, {}>(
  function FontModal(_props, ref) {
    const { t } = useTranslation();
    const accentFont = useUserPreferencesStore((state) => state.accentFont);
    const setAccentFont = useUserPreferencesStore(
      (state) => state.setAccentFont,
    );
    const { surface } = useTheme();

    return (
      <ModalSheet ref={ref} enableOverDrag={false}>
        <BottomSheetView className="gap-1">
          <ModalHeader title={t("title.font")} />

          <View className="overflow-hidden rounded-md">
            <Pressable
              android_ripple={{ color: surface }}
              onPress={() => {
                setAccentFont("NDot");
              }}
              disabled={accentFont === "NDot"}
              className={cn("min-h-12 justify-center p-4", {
                "bg-surface": accentFont === "NDot",
              })}
            >
              <Text className="font-ndot text-base leading-tight text-foreground">
                NDot
              </Text>
            </Pressable>
          </View>

          <View className="mb-3 overflow-hidden rounded-md">
            <Pressable
              android_ripple={{ color: surface }}
              onPress={() => {
                setAccentFont("NType");
              }}
              disabled={accentFont === "NType"}
              className={cn("min-h-12 justify-center p-4", {
                "bg-surface": accentFont === "NType",
              })}
            >
              <Text className="font-ntype text-base text-foreground">
                NType
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </ModalSheet>
    );
  },
);

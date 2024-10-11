import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";

import {
  useUserPreferencesStore,
  userPreferencesStore,
} from "@/services/UserPreferences";

import { NumericInput } from "@/components/new/Form";
import { ModalHeader, ModalSheet } from "@/components/new/Modal";
import { StyledText } from "@/components/new/Typography";

/** Modal that can be used to specify the minimum track duration we want to save. */
export const MinDurationModal = forwardRef<BottomSheetModal, {}>(
  function MinDurationModal(_props, ref) {
    const { t } = useTranslation();
    const minSeconds = useUserPreferencesStore((state) => state.minSeconds);
    const [newMin, setNewMin] = useState<string | undefined>();

    useEffect(() => {
      const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
        // Update user preference when we close the keyboard.
        updateMinDuration(newMin);
      });
      return () => {
        hideSubscription.remove();
      };
    }, [newMin]);

    return (
      <ModalSheet ref={ref} enableOverDrag={false}>
        <BottomSheetView className="gap-4">
          <ModalHeader title={t("title.ignoreDuration")} noPadding />
          <StyledText preset="dimOnCanvas" center className="text-sm">
            {t("settings.description.ignoreDuration")}
          </StyledText>

          <View className="mx-auto w-full max-w-[50%] items-center border-b border-foreground/60">
            <NumericInput
              defaultValue={`${minSeconds}`}
              onChangeText={(text) => setNewMin(text)}
            />
          </View>
        </BottomSheetView>
      </ModalSheet>
    );
  },
);

//#region Data
async function updateMinDuration(newDuration: string | undefined) {
  const asNum = Number(newDuration);
  // Validate that it's a positive integer.
  if (!Number.isInteger(asNum) || asNum < 0) return;
  userPreferencesStore.setState({ minSeconds: asNum });
  return;
}
//#endregion

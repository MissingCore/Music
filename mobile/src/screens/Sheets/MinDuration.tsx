import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";
import type { SheetProps } from "react-native-actions-sheet";

import {
  useUserPreferencesStore,
  userPreferencesStore,
} from "@/services/UserPreferences";

import { NumericInput } from "@/components/new/Form";
import { Sheet } from "@/components/new/Sheet";
import { StyledText } from "@/components/new/Typography";

/** Sheet used to specify the minimum track duration we want to save. */
export default function MinDurationSheet(
  props: SheetProps<"min-duration-sheet">,
) {
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
    <Sheet
      id={props.sheetId}
      title={t("title.ignoreDuration")}
      contentContainerClassName="gap-4"
    >
      <StyledText preset="dimOnCanvas" center className="text-sm">
        {t("settings.description.ignoreDuration")}
      </StyledText>
      <NumericInput
        defaultValue={`${minSeconds}`}
        onChangeText={(text) => setNewMin(text)}
        className="mx-auto w-full max-w-[50%] border-b border-foreground/60 text-center"
      />
    </Sheet>
  );
}

//#region Data
async function updateMinDuration(newDuration: string | undefined) {
  const asNum = Number(newDuration);
  // Validate that it's a positive integer.
  if (!Number.isInteger(asNum) || asNum < 0) return;
  userPreferencesStore.setState({ minSeconds: asNum });
  return;
}
//#endregion

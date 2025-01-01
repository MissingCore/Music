import { useEffect, useState } from "react";
import { Keyboard } from "react-native";

import {
  useUserPreferencesStore,
  userPreferencesStore,
} from "@/services/UserPreferences";

import { NumericInput } from "@/components/Form/Input";
import { Sheet } from "@/components/Sheet";
import { TStyledText } from "@/components/Typography/StyledText";

/** Sheet used to specify the minimum track duration we want to save. */
export default function MinDurationSheet() {
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
      id="MinDurationSheet"
      titleKey="title.ignoreDuration"
      contentContainerClassName="gap-4"
    >
      <TStyledText
        dim
        textKey="settings.description.ignoreDuration"
        className="text-center text-sm"
      />
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

import { Text } from "react-native";

import { useUserPreferencesStore } from "@/services/UserPreferences";

import { Radio } from "@/components/Form";
import { Sheet } from "@/components/Sheet";

/** Sheet allowing us to change the app's accent font. */
export default function FontSheet() {
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  const setAccentFont = useUserPreferencesStore((state) => state.setAccentFont);

  return (
    <Sheet
      id="FontSheet"
      titleKey="title.font"
      contentContainerClassName="gap-1"
    >
      <Radio
        selected={accentFont === "NDot"}
        onSelect={() => setAccentFont("NDot")}
      >
        <Text className="font-ndot text-base leading-tight text-foreground">
          NDot
        </Text>
      </Radio>
      <Radio
        selected={accentFont === "NType"}
        onSelect={() => setAccentFont("NType")}
      >
        <Text className="font-ntype text-base leading-tight text-foreground">
          NType
        </Text>
      </Radio>
    </Sheet>
  );
}

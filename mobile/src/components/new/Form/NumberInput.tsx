import { forwardRef } from "react";
import type { TextInputProps } from "react-native";
import { TextInput } from "react-native";

import { useUserPreferencesStore } from "@/services/UserPreferences";
import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";

/**
 * Pre-styled `<TextInput />` component for numeric inputs.
 *
 * Note: No option to select `<BottomSheetTextInput />` as dynamically
 * setting `editable=false` doesn't actually prevent the input from
 * being editable.
 */
export const NumberInput = forwardRef<TextInput, TextInputProps>(
  function NumberInput({ className, ...rest }, ref) {
    const accentFont = useUserPreferencesStore((state) => state.accentFont);
    const { foreground } = useTheme();

    return (
      <TextInput
        ref={ref}
        autoFocus
        inputMode="numeric"
        placeholderTextColor={`${foreground}99`} // 60% Opacity
        className={cn(
          "min-h-12 text-[3rem] text-foreground",
          {
            "font-ndot": accentFont === "NDot",
            "font-ntype": accentFont === "NType",
            "opacity-25": rest.editable === false,
          },
          className,
        )}
        {...rest}
      />
    );
  },
);

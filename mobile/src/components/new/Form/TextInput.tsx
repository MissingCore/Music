import { forwardRef } from "react";
import type { TextInputProps } from "react-native";
import { TextInput as RNTextInput } from "react-native";

import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";

/**
 * Pre-styled `<TextInput />` component.
 *
 * Note: No option to select `<BottomSheetTextInput />` as dynamically
 * setting `editable=false` doesn't actually prevent the input from
 * being editable.
 */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  function TextInput({ className, ...rest }, ref) {
    const { foreground } = useTheme();

    return (
      <RNTextInput
        ref={ref}
        autoFocus
        placeholderTextColor={`${foreground}99`} // 60% Opacity
        className={cn(
          "min-h-12 font-roboto text-base text-foreground",
          { "opacity-25": rest.editable === false },
          className,
        )}
        {...rest}
      />
    );
  },
);

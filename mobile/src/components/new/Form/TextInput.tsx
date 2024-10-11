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
export function TextInput({ className, ...rest }: TextInputProps) {
  const { foreground } = useTheme();

  return (
    <RNTextInput
      autoFocus
      placeholderTextColor={`${foreground}99`} // 60% Opacity
      className={cn(
        "min-h-12 text-base text-foreground",
        { "opacity-25": rest.editable === false },
        className,
      )}
      {...rest}
    />
  );
}

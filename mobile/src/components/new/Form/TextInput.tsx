import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import type { TextInputProps } from "react-native";
import { TextInput as RNTextInput } from "react-native";

import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";

/** Pre-styled `<TextInput />` component. */
export function TextInput({
  base,
  className,
  ...rest
}: TextInputProps & { base?: "rn" | "gorhom" }) {
  const Element = base === "gorhom" ? BottomSheetTextInput : RNTextInput;
  const { foreground } = useTheme();

  return (
    <Element
      autoFocus
      placeholderTextColor={`${foreground}99`} // 60% Opacity
      className={cn(
        "min-h-12 text-base text-foreground disabled:opacity-25",
        className,
      )}
      {...rest}
    />
  );
}

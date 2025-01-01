import type { TextInputProps } from "react-native";
import { TextInput as RNTextInput } from "react-native";

import { useUserPreferencesStore } from "@/services/UserPreferences";

import { cn, getAccentFont } from "@/lib/style";

//#region Numeric Input
/** Numeric input using the accent font. */
export function NumericInput({ className, style, ...props }: TextInputProps) {
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  return (
    <RNTextInput
      autoFocus
      inputMode="numeric"
      className={cn(
        "min-h-12 text-[3rem] text-foreground placeholder:text-foreground/60",
        { "opacity-25": props.editable === false },
        className,
      )}
      style={[{ fontFamily: getAccentFont(accentFont) }, style]}
      {...props}
    />
  );
}
//#endregion

//#region Text Input
/** Styled text input meeting the recommended touch target size. */
export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <RNTextInput
      autoFocus
      className={cn(
        "min-h-12 font-roboto text-base text-foreground placeholder:text-foreground/60",
        { "opacity-25": props.editable === false },
        className,
      )}
      {...props}
    />
  );
}
//#endregion

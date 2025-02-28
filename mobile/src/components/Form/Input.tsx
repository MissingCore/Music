import { forwardRef, useRef } from "react";
import type { TextInputProps } from "react-native";
import { TextInput as RNTextInput } from "react-native";

import { useUserPreferencesStore } from "~/services/UserPreferences";

import { cn, getFont } from "~/lib/style";

//#region Numeric Input
/** Numeric input using the accent font. */
export const NumericInput = forwardRef<RNTextInput, TextInputProps>(
  function NumericInput({ className, style, ...props }, ref) {
    const accentFont = useUserPreferencesStore((state) => state.accentFont);
    return (
      <RNTextInput
        ref={ref}
        autoFocus
        inputMode="numeric"
        className={cn(
          "min-h-12 text-[3rem] text-foreground placeholder:text-foreground/60",
          { "opacity-25": props.editable === false },
          className,
        )}
        style={[{ fontFamily: getFont(accentFont) }, style]}
        {...props}
      />
    );
  },
);
//#endregion

//#region Text Input
/** Styled text input meeting the recommended touch target size. */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  function TextInput({ className, ...props }, ref) {
    return (
      <RNTextInput
        ref={ref}
        autoFocus
        className={cn(
          "min-h-12 font-roboto text-base text-foreground placeholder:text-foreground/60",
          { "opacity-25": props.editable === false },
          className,
        )}
        {...props}
      />
    );
  },
);
//#endregion

//#region Hook
/** Hook to get a ref for the input element. */
export function useInputRef() {
  const inputRef = useRef<RNTextInput>(null);
  return inputRef;
}
//#endregion

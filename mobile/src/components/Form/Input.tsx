import { useRef } from "react";
import type { TextInputProps } from "react-native";
import { TextInput as RNTextInput } from "react-native-gesture-handler";

import { useUserPreferencesStore } from "~/services/UserPreferences";

import { cn, getFont } from "~/lib/style";

export function useInputRef() {
  return useRef<RNTextInput>(null);
}

type InputProps = TextInputProps & { ref?: React.Ref<RNTextInput> };

//#region Numeric Input
/** Numeric input using the accent font. */
export function NumericInput({ className, style, ...props }: InputProps) {
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  return (
    <RNTextInput
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
}

//#endregion

//#region Text Input
/** Styled text input meeting the recommended touch target size. */
export function TextInput({ className, style, ...props }: InputProps) {
  const primaryFont = useUserPreferencesStore((state) => state.primaryFont);
  return (
    <RNTextInput
      className={cn(
        "min-h-12 text-base text-foreground placeholder:text-foreground/60",
        { "opacity-25": props.editable === false },
        className,
      )}
      style={[{ fontFamily: getFont(primaryFont) }, style]}
      {...props}
    />
  );
}
//#endregion

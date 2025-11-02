import { useRef } from "react";
import type { TextInputProps } from "react-native";
import { TextInput as RNTextInput } from "react-native-gesture-handler";

import { useUserPreferenceStore } from "~/stores/UserPreference/store";

import { OnRTL } from "~/lib/react";
import { cn, getFont } from "~/lib/style";

export function useInputRef() {
  return useRef<RNTextInput>(null);
}

type InputProps = TextInputProps & { ref?: React.Ref<RNTextInput> };

//#region Numeric Input
/** Numeric input using the accent font. */
export function NumericInput({ className, style, ...props }: InputProps) {
  const accentFont = useUserPreferenceStore((s) => s.accentFont);
  return (
    <RNTextInput
      inputMode="numeric"
      // FIXME: For some random reason, inputs have a default vertical padding
      // in React Native 0.79.
      //  - Might be related to: https://github.com/facebook/react-native/pull/48523
      className={cn(
        "min-h-12 py-0 text-[3rem] text-foreground placeholder:text-foreground/60",
        { "opacity-25": props.editable === false },
        className,
      )}
      style={[{ fontFamily: getFont(accentFont) }, style]}
      textAlign={OnRTL.decide("right", "left")}
      {...props}
    />
  );
}
//#endregion

//#region Text Input
/** Styled text input meeting the recommended touch target size. */
export function TextInput({ className, style, ...props }: InputProps) {
  const primaryFont = useUserPreferenceStore((s) => s.primaryFont);
  return (
    <RNTextInput
      // FIXME: For some random reason, inputs have a default vertical padding
      // in React Native 0.79.
      //  - Might be related to: https://github.com/facebook/react-native/pull/48523
      className={cn(
        "min-h-12 py-0 text-base text-foreground placeholder:text-foreground/60",
        { "opacity-25": props.editable === false },
        className,
      )}
      style={[{ fontFamily: getFont(primaryFont) }, style]}
      textAlign={OnRTL.decide("right", "left")}
      {...props}
    />
  );
}
//#endregion

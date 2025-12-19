import { useRef } from "react";
import type { TextInputProps } from "react-native";
import { TextInput as RNTextInput } from "react-native-gesture-handler";

import { usePreferenceStore } from "~/stores/Preference/store";

import { FontSize } from "~/constants/Styles";
import { OnRTL } from "~/lib/react";
import { cn, getFont } from "~/lib/style";

export function useInputRef() {
  return useRef<RNTextInput>(null);
}

type InputProps = TextInputProps & { ref?: React.Ref<RNTextInput> };

//#region Numeric Input
/** Numeric input using the accent font. */
export function NumericInput({ className, style, ...props }: InputProps) {
  const accentFont = usePreferenceStore((s) => s.accentFont);
  return (
    <RNTextInput
      inputMode="numeric"
      // FIXME: For some random reason, inputs have a default vertical padding
      // in React Native 0.79. Might be related to:
      //  - https://github.com/facebook/react-native/pull/48523
      //  - https://github.com/facebook/react-native/issues/50692
      className={cn(
        "min-h-12 py-0 text-foreground placeholder:text-foreground/60",
        { "opacity-25": props.editable === false },
        className,
      )}
      style={[
        { fontFamily: getFont(accentFont), fontSize: FontSize["5xl"] },
        style,
      ]}
      textAlign={OnRTL.decide("right", "left")}
      {...props}
    />
  );
}
//#endregion

//#region Text Input
/** Styled text input meeting the recommended touch target size. */
export function TextInput({ className, style, ...props }: InputProps) {
  const primaryFont = usePreferenceStore((s) => s.primaryFont);
  return (
    <RNTextInput
      // FIXME: For some random reason, inputs have a default vertical padding
      // in React Native 0.79. Might be related to:
      //  - https://github.com/facebook/react-native/pull/48523
      //  - https://github.com/facebook/react-native/issues/50692
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

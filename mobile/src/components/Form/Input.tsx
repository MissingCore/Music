import { useMemo, useRef } from "react";
import type { TextInputProps } from "react-native";
import { TextInput as RNTextInput } from "react-native";
import { TextInput as RNGHTextInput } from "react-native-gesture-handler";

import { usePreferenceStore } from "~/stores/Preference/store";

import { FontSize } from "~/constants/Styles";
import { OnRTL } from "~/lib/react";
import { cn, getFont } from "~/lib/style";

export function useInputRef() {
  return useRef<RNTextInput | RNGHTextInput>(null);
}

type InputProps = TextInputProps & {
  ref?: React.Ref<RNTextInput | RNGHTextInput>;
  forSheet?: boolean;
};

//#region Numeric Input
/** Numeric input using the accent font. */
export function NumericInput({
  className,
  style,
  forSheet,
  ...props
}: InputProps) {
  const accentFont = usePreferenceStore((s) => s.accentFont);
  const Input = useMemo(
    () => (forSheet ? RNGHTextInput : RNTextInput),
    [forSheet],
  );

  return (
    // @ts-expect-error - Ref is compatible.
    <Input
      inputMode="numeric"
      //? The order of where we define certain props is important with
      //? Uniwind. For example, `text-align` styles don't get applied if
      //? the `textAlign` prop is defined after `className` & `style`.
      textAlign={OnRTL.decide("right", "left")}
      placeholderTextColorClassName="accent-onSurfaceVariant"
      // FIXME: For some random reason, inputs have a default vertical padding
      // in React Native 0.79. Might be related to:
      //  - https://github.com/facebook/react-native/pull/48523
      //  - https://github.com/facebook/react-native/issues/50692
      className={cn(
        "min-h-12 py-0 text-onSurface",
        { "opacity-25": props.editable === false },
        className,
      )}
      style={[
        { fontFamily: getFont(accentFont), fontSize: FontSize["5xl"] },
        style,
      ]}
      {...props}
    />
  );
}
//#endregion

//#region Text Input
/** Styled text input meeting the recommended touch target size. */
export function TextInput({
  className,
  style,
  forSheet,
  ...props
}: InputProps) {
  const primaryFont = usePreferenceStore((s) => s.primaryFont);
  const Input = useMemo(
    () => (forSheet ? RNGHTextInput : RNTextInput),
    [forSheet],
  );

  return (
    // @ts-expect-error - Ref is compatible.
    <Input
      textAlign={OnRTL.decide("right", "left")}
      placeholderTextColorClassName="accent-onSurface/60"
      // FIXME: For some random reason, inputs have a default vertical padding
      // in React Native 0.79. Might be related to:
      //  - https://github.com/facebook/react-native/pull/48523
      //  - https://github.com/facebook/react-native/issues/50692
      className={cn(
        "min-h-12 py-0 text-base text-onSurface",
        { "opacity-25": props.editable === false },
        className,
      )}
      style={[{ fontFamily: getFont(primaryFont) }, style]}
      {...props}
    />
  );
}
//#endregion

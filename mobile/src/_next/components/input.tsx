// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useRef } from "react";
import type { TextInputInstance, TextInputProps } from "react-native";
import { TextInput as RNTextInput } from "react-native";

import { getFont, useTheme } from "~/_next/context/theme-context";

import { OnRTL } from "~/_next/utils/i18n";
import { cn } from "~/_next/utils/style";

export function useInputRef() {
  return useRef<TextInputInstance>(null);
}

export interface InputProps extends TextInputProps {
  ref?: React.Ref<TextInputInstance>;
}

/** Styled text input meeting the recommended touch target size. */
export function TextInput({ className, style, ...props }: InputProps) {
  const {
    colors: { text, textMuted },
    fonts: { primary },
  } = useTheme();

  return (
    <RNTextInput
      textAlign={OnRTL.decide("right", "left")}
      placeholderTextColor={textMuted}
      // FIXME: For some random reason, inputs have a default vertical padding
      // in React Native 0.79. Might be related to:
      //  - https://github.com/facebook/react-native/pull/48523
      //  - https://github.com/facebook/react-native/issues/50692
      className={cn(
        "py-0 text-base",
        { "opacity-25": props.editable === false },
        className,
      )}
      style={[
        {
          fontFamily: getFont(primary),
          borderColor: textMuted,
          color: text,
        },
        style,
      ]}
      {...props}
    />
  );
}

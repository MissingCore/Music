// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useRef } from "react";
import type { TextInputProps } from "react-native";
import { TextInput as RNTextInput, View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { getFont } from "~/modules/customization/font/utils";
import type { SupportedIconName } from "./icon";
import { Icon } from "./icon";

export function useInputRef() {
  return useRef<RNTextInput>(null);
}

export type InputProps = TextInputProps & {
  ref?: React.Ref<RNTextInput>;
};

//#region Text Input
function TextInput({ className, style, ...props }: InputProps) {
  const primaryFont = usePreferenceStore((s) => s.primaryFont);
  return (
    <RNTextInput
      textAlign={OnRTL.decide("right", "left")}
      placeholderTextColorClassName="accent-onSurfaceVariant"
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

//#region Pill Field
function Pill({
  leadingIcon,
  outline = false,
  TrailingActions,
  className,
  ...props
}: InputProps & {
  leadingIcon?: SupportedIconName;
  outline?: boolean;
  TrailingActions?: React.ReactNode;
}) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-2 rounded-full bg-surfaceContainerLowest",
        { "border border-outlineVariant": outline },
      )}
    >
      {leadingIcon ? (
        <Icon
          name={leadingIcon}
          className="absolute inset-y-0 left-0 justify-center pl-4"
        />
      ) : null}
      <TextInput
        {...props}
        className={cn(
          "shrink grow px-4",
          { "pl-12": Boolean(leadingIcon), "pr-0": Boolean(TrailingActions) },
          className,
        )}
      />
      {TrailingActions}
    </View>
  );
}
//#endregion

//#region Exports
TextInput.Pill = Pill;

export { TextInput };
//#endregion

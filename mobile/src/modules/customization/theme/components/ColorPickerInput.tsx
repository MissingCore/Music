// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from "react";
import { View } from "react-native";

import { Ripple } from "~/components/Base/Pressable";
import { ExtendedTButton } from "~/components/Form/Button";
import { TextInput } from "~/components/Form/Input";
import { Modal } from "~/components/Modal";
import { Em, StyledText } from "~/components/Typography/StyledText";
import { ColorPicker } from "./ColorPicker";
import type { HexColor } from "../core/constants";
import { normalizeHexColor } from "../core/utils";

export function ColorPickerInput(props: {
  label: string;
  value: HexColor;
  onUpdateValue: (color: HexColor) => void;
  disabled?: boolean;
}) {
  const [draftValue, setDraftValue] = useState<string>(props.value);
  const [showPicker, setShowPicker] = useState(false);

  const onChange = (text: string) => {
    setDraftValue(text.toUpperCase());
    const normalized = normalizeHexColor(text);
    if (normalized) props.onUpdateValue(normalized);
  };

  const onPickerComplete = (hex: HexColor) => {
    setDraftValue(hex);
    props.onUpdateValue(hex);
  };

  return (
    <View className="flex-1">
      <Ripple
        accessibilityLabel={`Pick ${props.label} color`}
        onPress={() => setShowPicker(true)}
        disabled={props.disabled}
        className="min-h-14 flex-row gap-0 rounded-sm border border-outline"
      >
        <View
          className="aspect-square h-full"
          //? Suppress warning that thinks we're using a SharedValue in inline styles.
          style={{ backgroundColor: `${props.value}` }}
        />
        <View className="shrink grow p-2">
          <Em>{props.label}</Em>
          <StyledText className="text-sm text-onSurfaceVariant">
            {props.value}
          </StyledText>
        </View>
      </Ripple>

      <Modal visible={showPicker}>
        <View className="gap-4">
          <View className="flex-row items-center justify-between gap-2">
            <Em>{props.label}</Em>
            <TextInput
              value={draftValue}
              onChangeText={onChange}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              className="h-6 min-h-0 w-15 rounded-xs border border-outline p-1 text-xs text-onSurfaceVariant"
              style={{ fontFamily: "GeistMono-Regular" }}
            />
          </View>

          <ColorPicker value={props.value} onComplete={onPickerComplete} />

          <ExtendedTButton
            textKey="form.close"
            onPress={() => setShowPicker(false)}
            className="bg-surfaceContainer"
          />
        </View>
      </Modal>
    </View>
  );
}

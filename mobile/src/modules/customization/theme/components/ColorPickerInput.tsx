// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from "react";
import { View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";

import { Ripple } from "~/components/Base/Pressable";
import { ExtendedTButton } from "~/components/Form/Button";
import { TextInput } from "~/components/Form/Input";
import { Modal } from "~/components/Modal";
import { Em, StyledText } from "~/components/Typography/StyledText";
import { ColorPicker } from "./ColorPicker";
import { OpacitySlider, hexToAlpha } from "./OpacitySlider";
import type { HexColor } from "../core/constants";
import { normalizeHexColor } from "../core/utils";

export function ColorPickerInput(props: {
  label: string;
  value: HexColor;
  onUpdateValue: (color: HexColor) => void;
  disabled?: boolean;
}) {
  const [draftHex, setDraftHex] = useState<string>(props.value.slice(0, 7));
  const [showPicker, setShowPicker] = useState(false);
  const enableOpacitySlider = usePreferenceStore((s) => s.opaqueColors);

  const currHex = props.value.slice(0, 7) as HexColor;
  const alphaHex = props.value.slice(7, 9) || "";

  const onChange = (text: string) => {
    setDraftHex(text.toUpperCase());
    const normalized = normalizeHexColor(text);
    if (normalized) props.onUpdateValue(`${normalized}${alphaHex}`);
  };

  const onPickerComplete = (hex: HexColor) => {
    setDraftHex(hex);
    props.onUpdateValue(`${hex}${alphaHex}`);
  };

  const onAlphaChange = (alpha: string) => {
    props.onUpdateValue(`${currHex}${alpha}`);
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
            {currHex}
            {enableOpacitySlider
              ? ` / ${Math.round(hexToAlpha(alphaHex) * 100)}%`
              : null}
          </StyledText>
        </View>
      </Ripple>

      <Modal visible={showPicker}>
        <View className="gap-4">
          <View className="flex-row items-center justify-between gap-2">
            <Em>{props.label}</Em>
            <TextInput
              value={draftHex}
              onChangeText={onChange}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              className="h-6 min-h-0 w-15 rounded-xs border border-outline p-1 text-xs text-onSurfaceVariant"
              style={{ fontFamily: "GeistMono-Regular" }}
            />
          </View>

          <ColorPicker value={currHex} onComplete={onPickerComplete} />
          {enableOpacitySlider ? (
            <OpacitySlider
              key={currHex} //? Needed as `onComplete` gets cached.
              color={currHex}
              value={alphaHex}
              onComplete={onAlphaChange}
            />
          ) : null}

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

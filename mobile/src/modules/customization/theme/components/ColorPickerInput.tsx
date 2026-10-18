// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";

import { Dialog } from "~/components/next/base/dialog";
import { TextInput } from "~/components/next/base/input";
import { Ripple } from "~/components/next/base/ripple";
import { Text } from "~/components/next/base/typography";
import { ActionButton } from "~/components/next/blocks/button-action";
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
  const { t } = useTranslation();
  const [draftHex, setDraftHex] = useState<string>(props.value.slice(0, 7));
  const [showPicker, setShowPicker] = useState(false);
  const enableOpacitySlider = usePreferenceStore((s) => s.opaqueColors);

  const currHex = props.value.slice(0, 7) as HexColor;
  const alphaHex = props.value.slice(7, 9) || "";

  const onChange = (text: string) => {
    setDraftHex(text.toUpperCase());
    const normalized = normalizeHexColor(text);
    if (normalized) {
      const baseColor = normalized.slice(0, 7) as HexColor;
      props.onUpdateValue(`${baseColor}${alphaHex}`);
    }
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
        className="min-h-14 flex-row items-center rounded-lg border border-outline"
      >
        <View
          className="aspect-square h-full"
          //? Suppress warning that thinks we're using a SharedValue in inline styles.
          style={{ backgroundColor: `${props.value}` }}
        />
        <View className="shrink grow p-2">
          <Text intent="em">{props.label}</Text>
          <Text muted size="sm">
            {currHex}
            {enableOpacitySlider
              ? ` / ${Math.round(hexToAlpha(alphaHex) * 100)}%`
              : null}
          </Text>
        </View>
      </Ripple>

      <Dialog visible={showPicker} onClose={() => setShowPicker(false)}>
        <View className="gap-4">
          <View className="flex-row items-center justify-between gap-2">
            <Text intent="em">{props.label}</Text>
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

          <Dialog.Actions>
            <ActionButton
              label={t("form.close")}
              onPress={() => setShowPicker(false)}
            />
          </Dialog.Actions>
        </View>
      </Dialog>
    </View>
  );
}

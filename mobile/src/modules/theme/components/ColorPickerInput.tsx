import { useState } from "react";
import { View } from "react-native";
import type { ColorFormatsObject } from "reanimated-color-picker";
import ColorPicker, { HueSlider, Panel1 } from "reanimated-color-picker";

import { BorderRadius } from "~/constants/Styles";
import { Pressable } from "~/components/Base/Pressable";
import { ExtendedTButton } from "~/components/Form/Button";
import { TextInput } from "~/components/Form/Input";
import { Modal } from "~/components/Modal";
import { Em, StyledText } from "~/components/Typography/StyledText";
import type { HexColor } from "../constants";
import { normalizeHexColor } from "../helpers/color";

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

  const onPickerComplete = (colors: ColorFormatsObject) => {
    const normalized = normalizeHexColor(colors.hex);
    if (normalized) props.onUpdateValue(normalized);
  };

  return (
    <View className="flex-1">
      <Pressable
        accessibilityLabel={`Pick ${props.label} color`}
        onPress={() => setShowPicker(true)}
        disabled={props.disabled}
        className="min-h-14 flex-row items-center overflow-hidden rounded-sm border border-outline active:opacity-50"
      >
        <View
          className="aspect-square h-full"
          style={{ backgroundColor: props.value }}
        />
        <View className="p-2">
          <Em>{props.label}</Em>
          <StyledText className="text-sm text-onSurfaceVariant">
            {props.value}
          </StyledText>
        </View>
      </Pressable>

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

          <ColorPicker
            value={props.value}
            onCompleteJS={onPickerComplete}
            thumbSize={20}
            sliderThickness={26}
            boundedThumb
            style={{ gap: 12 }}
          >
            <Panel1 style={{ borderRadius: BorderRadius.md }} />
            <HueSlider style={{ borderRadius: BorderRadius.full }} />
          </ColorPicker>

          <ExtendedTButton
            textKey="form.close"
            onPress={() => setShowPicker(false)}
            className="bg-surfaceContainer active:bg-surfaceContainerHigh"
          />
        </View>
      </Modal>
    </View>
  );
}

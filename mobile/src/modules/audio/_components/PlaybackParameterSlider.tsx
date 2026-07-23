// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { memo, useCallback, useMemo } from "react";
import { View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import type { SupportedIconName } from "~/resources/icons";
import { sessionStore, useSessionStore } from "~/stores/Session/store";

import { capitalize } from "~/utils/string";
import { Button } from "~/components/Form/Button";
import { LabeledSlider } from "~/components/Form/Slider.variant";
import { SegmentedList } from "~/components/List/Segmented";
import { Em, TStyledText } from "~/components/Typography/StyledText";

const PRESET_OPTIONS = [1, 1.25, 1.5, 2] as const;

export const PlaybackParameterSlider = memo(
  function PlaybackParameterSlider(props: {
    field: "pitch" | "speed";
    onUpdate: (value: number) => void;
    icon: SupportedIconName;
  }) {
    const fieldName = `playback${capitalize(props.field)}` as const;
    const fieldNameKey = `feat.playback.extra.${props.field}` as const;

    const storedValue = useSessionStore((s) => s[fieldName]);
    const cachedValue = useSharedValue(storedValue);

    const setField = useCallback(
      (value: number) => {
        sessionStore.setState({ [fieldName]: value });
        props.onUpdate(value);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [props.onUpdate, fieldName],
    );

    const PresetButtons = useMemo(() => {
      return PRESET_OPTIONS.map((preset) => (
        <Button
          key={preset}
          onPress={() => {
            setField(preset);
            cachedValue.set(preset);
          }}
          className="min-h-8 flex-1 rounded-full bg-surfaceContainerLow py-2"
        >
          <Em>{formatValue(preset)}</Em>
        </Button>
      ));
    }, [cachedValue, setField]);

    return (
      <SegmentedList.CustomItem className="gap-4 p-4">
        <TStyledText textKey={fieldNameKey} className="text-sm" />
        <LabeledSlider
          initValue={storedValue}
          liveValue={cachedValue}
          min={0.25}
          max={2}
          step={0.05}
          onChange={setField}
          icon={props.icon}
          displayedValue={`${numberFormatter.format(storedValue)}x`}
        />
        <View className="flex-row items-center gap-4">{PresetButtons}</View>
      </SegmentedList.CustomItem>
    );
  },
);

//#region Helpers
const numberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

function formatValue(val: number) {
  return `${numberFormatter.format(val)}x`;
}
//#endregion

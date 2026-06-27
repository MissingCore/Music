// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { memo } from "react";
import { View } from "react-native";

import { usePlaybackStore } from "~/stores/Playback/store";
import * as ReplayGain from "../core/actions";
import { DB_OFFSET } from "../core/constants";

import { TEm } from "~/components/Typography/StyledText";
import { AudioEffectSlider } from "../../_components/AudioEffectSlider";

export const PreAmpSlider = memo(function PreAmpSlider(props: {
  field: "preAmpWTags" | "preAmpWOTags";
  disabled: boolean;
}) {
  const preAmpValue = usePlaybackStore((s) => s[props.field]);
  return (
    <View className="gap-2">
      <TEm
        textKey={`feat.replayGain.extra.${props.field === "preAmpWTags" ? "adjustWithTags" : "adjustWithoutTags"}`}
      />
      <AudioEffectSlider
        initValue={preAmpValue}
        min={DB_OFFSET.min}
        max={DB_OFFSET.max}
        step={0.1}
        onChange={
          props.field === "preAmpWTags"
            ? ReplayGain.updatePreAmpWithTags
            : ReplayGain.updatePreAmpWithoutTags
        }
        disabled={props.disabled}
        anchorAt={0}
        displayedValue={`${preAmpValue >= 0 ? "+" : ""}${preAmpValue.toFixed(1)} dB`}
      />
    </View>
  );
});

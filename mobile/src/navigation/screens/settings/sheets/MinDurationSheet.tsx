// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { scheduleOnRN } from "react-native-worklets";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { TText } from "~/components/next/base/typography";
import type { LabeledSliderProps } from "~/components/next/blocks/slider-labeled";
import { LabeledSlider } from "~/components/next/blocks/slider-labeled";

export function MinDurationSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const minSeconds = usePreferenceStore((s) => s.minSeconds);
  const [stopDrag, setStopDrag] = useState(false);

  const columnSizeSliderOptions = useMemo<
    Omit<LabeledSliderProps, "initValue">
  >(
    () => ({
      min: 0,
      max: 60,
      label: t("feat.minTrackDuration.title"),
      formatValue: (value) => {
        "worklet";
        return `${value}s`;
      },
      onChange: (value) => {
        "worklet";
        scheduleOnRN(PreferenceSetters.setMinSeconds, value);
      },
      onStatusChange: (status) => {
        "worklet";
        scheduleOnRN(setStopDrag, status !== "idle");
      },
    }),
    [t],
  );

  return (
    <Sheet ref={props.ref} draggable={!stopDrag}>
      <TText textKey="feat.minTrackDuration.description" muted size="sm" />
      <LabeledSlider initValue={minSeconds} {...columnSizeSliderOptions} />
    </Sheet>
  );
}

// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { scheduleOnRN } from "react-native-worklets";

import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { ViewPreferenceSetters } from "~/stores/ViewPreference/actions";
import {
  GridColumnSizeConfig,
  ListColumnSizeConfig,
} from "~/stores/ViewPreference/utils";
import {
  useCompactGridLayoutConfig,
  useGridLayoutConfig,
  useListLayoutConfig,
} from "~/hooks/useLayoutConfigs";

import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { Text } from "~/components/next/base/typography";
import type { LabeledSliderProps } from "~/components/next/blocks/slider-labeled";
import { LabeledSlider } from "~/components/next/blocks/slider-labeled";

export function ColumnSizeSheet(props: { ref: SheetRef }) {
  const [stopDrag, setStopDrag] = useState(false);
  return (
    <Sheet ref={props.ref} draggable={!stopDrag}>
      <ColumnSizeSlider field="list" setStopDrag={setStopDrag} />
      <ColumnSizeSlider field="grid" setStopDrag={setStopDrag} />
      <ColumnSizeSlider field="compactGrid" setStopDrag={setStopDrag} />
    </Sheet>
  );
}

const ColumnConfig = {
  list: { bound: ListColumnSizeConfig.bound, hook: useListLayoutConfig },
  grid: { bound: GridColumnSizeConfig.bound, hook: useGridLayoutConfig },
  compactGrid: {
    bound: GridColumnSizeConfig.bound,
    hook: useCompactGridLayoutConfig,
  },
} as const;

function ColumnSizeSlider(props: {
  field: keyof typeof ColumnConfig;
  setStopDrag: (stopDrag: boolean) => void;
}) {
  const fieldName = `${props.field}Size` as const;
  const setColumnValue = useMemo(
    () => ViewPreferenceSetters.setColumnSize(fieldName),
    [fieldName],
  );

  const { t } = useTranslation();
  const columnSize = useViewPreferenceStore((s) => s[fieldName]);

  const Config = ColumnConfig[props.field];
  //? Column calculation is different based on the grid layout.
  const { count } = Config.hook({ minWidth: columnSize });

  const columnSizeSliderOptions = useMemo<
    Omit<LabeledSliderProps, "initValue">
  >(
    () => ({
      ...Config.bound,
      label: t(`feat.modalViewPreference.extra.${props.field}`),
      formatValue: (value) => {
        "worklet";
        return String(value);
      },
      onChange: (value) => {
        "worklet";
        scheduleOnRN(setColumnValue, value);
      },
      onStatusChange: (status) => {
        "worklet";
        scheduleOnRN(props.setStopDrag, status !== "idle");
      },
    }),
    [t, props.field, props.setStopDrag, setColumnValue, Config],
  );

  return (
    <View className="gap-1">
      <LabeledSlider initValue={columnSize} {...columnSizeSliderOptions} />
      <Text muted>
        {t("feat.modalViewPreference.extra.columnCount", { count })}
      </Text>
    </View>
  );
}

// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { View } from "react-native";

import { Marquee } from "../Marquee";
import { Em, TEm } from "../Typography/StyledText";

export function SheetLabelAction(props: {
  labelKey?: ParseKeys;
  label?: string;
  RightElement: React.ReactNode;
}) {
  return (
    <View className="min-h-8 flex-row items-center justify-between gap-2">
      <Marquee color="surfaceBright">
        {props.labelKey ? (
          <TEm textKey={props.labelKey} className="text-sm" />
        ) : (
          <Em className="text-sm">{props.label}</Em>
        )}
      </Marquee>
      {props.RightElement}
    </View>
  );
}

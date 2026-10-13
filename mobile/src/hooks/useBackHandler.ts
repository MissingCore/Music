// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { DependencyList } from "react";
import { useEffect } from "react";
import { BackHandler } from "react-native";

export function useBackHandler(
  handler: () => boolean,
  deps: DependencyList,
  enabled = true,
) {
  useEffect(
    () => {
      if (!enabled) return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handler,
      );
      return () => subscription.remove();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handler, enabled, ...deps],
  );
}

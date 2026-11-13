// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { DependencyList } from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { BackHandler } from "react-native";

export function useBackHandler(
  handler: () => boolean,
  deps: DependencyList,
  enabled = true,
) {
  //? https://www.epicreact.dev/the-latest-ref-pattern-in-react
  const handlerRef = useRef(handler);
  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(
    () => {
      if (!enabled) return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => handlerRef.current(),
      );
      return () => subscription.remove();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, ...deps],
  );
}

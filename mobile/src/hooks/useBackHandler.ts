// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import BackgroundTimer from "@boterop/react-native-background-timer";
import type { DependencyList } from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { BackHandler } from "react-native";

export function useBackHandler(
  handler: () => boolean,
  deps: DependencyList,
  enabled = true,
  /**
   * Delay registration of back handler. This can be useful in the situation
   * where we want the back handler registered in the children to fire after
   * the registration in the rendered component.
   */
  registrationDelay = 0,
) {
  //? https://www.epicreact.dev/the-latest-ref-pattern-in-react
  const handlerRef = useRef(handler);
  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(
    () => {
      if (!enabled) return;

      let timer: number | undefined;
      let subscription: { remove: VoidFunction } | undefined;

      const registerEvent = () => {
        subscription = BackHandler.addEventListener("hardwareBackPress", () =>
          handlerRef.current(),
        );
      };

      if (registrationDelay === 0) registerEvent();
      else timer = BackgroundTimer.setTimeout(registerEvent, registrationDelay);

      return () => {
        if (timer !== undefined) BackgroundTimer.clearTimeout(timer);
        if (subscription) subscription.remove();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, ...deps],
  );
}

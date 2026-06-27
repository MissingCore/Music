// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useEffect, useState } from "react";

/** Sends a "Ready" signal after a delay. */
export function useDelayedReady(delayMs = 500) {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setIsReady(true), delayMs);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return isReady;
}

// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use } from "react";

export const AtmosphereSubtreeContext = createContext(false);

export function useIsAtmosphereActive() {
  return use(AtmosphereSubtreeContext);
}

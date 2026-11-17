// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext } from "react";

import type { PlayFromSource } from "~/_next/constants/media";
import { ReservedNames } from "~/_next/constants/media";

export const PlayFromContext = createContext<PlayFromSource>({
  type: "playlist",
  id: ReservedNames.tracks,
});

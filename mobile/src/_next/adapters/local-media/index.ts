// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { LocalMediaArtistConnector } from "./connectors/artist";
import type { Adapter } from "../types";

export const LocalMediaAdapter = {
  artist: LocalMediaArtistConnector,
} as const satisfies Adapter;

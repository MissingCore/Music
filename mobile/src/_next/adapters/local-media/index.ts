// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { LocalMediaArtistConnector } from "./connectors/artist";
import { LocalMediaGenreConnector } from "./connectors/genre";
import type { Adapter } from "../types";

export const LocalMediaAdapter = {
  artist: LocalMediaArtistConnector,
  genre: LocalMediaGenreConnector,
} as const satisfies Adapter;

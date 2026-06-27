// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";

import { queries as q } from "../keyStore";

//#region Queries
export function useLyric(lyricId: string) {
  return useQuery({ ...q.lyrics.detail(lyricId) });
}

export function useLyricForTrack(trackId: string) {
  return useQuery({ ...q.lyrics.forTrack(trackId) });
}

export function useLyrics() {
  return useQuery({ ...q.lyrics.all });
}
//#endregion

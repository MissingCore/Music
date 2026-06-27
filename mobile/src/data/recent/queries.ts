// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";

import { getRecentMedia } from "./api";

//#region Queries
export function useRecentlyPlayedMedia() {
  return useQuery({
    queryKey: ["recent", "all"],
    queryFn: getRecentMedia,
    gcTime: 0,
    staleTime: 0,
  });
}
//#endregion

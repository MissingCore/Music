// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";

import { queries as q } from "../keyStore";

//#region Queries
export function useArtists() {
  return useQuery({ ...q.artists.all });
}
//#endregion

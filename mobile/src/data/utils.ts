// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { viewPreferenceStore } from "~/stores/ViewPreference/store";
import type { MutableTrackOrder } from "~/stores/ViewPreference/types";

import { iAsc, iDesc } from "~/lib/drizzle";
import type { TracksSortOptions } from "./types";
import { structuredTracksView } from "./views";

export function commonTracksOrIds<
  TResult extends Record<string, any>,
  TOnlyIds extends boolean | undefined = false,
>(data: Array<Record<string, unknown>>, onlyIds?: TOnlyIds) {
  return (
    onlyIds
      ? data
      : data.map(({ artists, ...rest }) => ({
          ...rest,
          artists: fromJSONArrayString(artists as string),
        }))
  ) as TOnlyIds extends true ? Array<{ id: string }> : TResult[];
}

export function getTracksOrderedBy<TScreen extends MutableTrackOrder>(
  screen: TScreen,
  sortOptions?: TracksSortOptions<TScreen>,
) {
  const isAsc =
    sortOptions?.isAsc ?? viewPreferenceStore.getState()[`${screen}IsAsc`];
  const order =
    sortOptions?.order ?? viewPreferenceStore.getState()[`${screen}Order`];

  //? Determine field we'll sort by.
  const sortField =
    order === "artistName"
      ? structuredTracksView.artistsName
      : // @ts-expect-error - Order key exists in `structuredTracksView`.
        structuredTracksView[order];

  return isAsc ? iAsc(sortField) : iDesc(sortField);
}

export function fromJSONArrayString(rawJSONString: string | null | unknown) {
  let results: string[] = [];
  // `rawJSONString` returns `string[]` or `null` as we use `NULLIF` to
  // prevent returning `[null]`.
  if (typeof rawJSONString === "string") {
    try {
      results = JSON.parse(rawJSONString);
    } catch {}
  }
  return results.length > 0 ? results : null;
}

export function unencodeJSONArtworkArray(rawJSONString: string | null) {
  let results: Array<string | null> = [];
  // `rawJSONString` returns `string[]` or `null` as we use `NULLIF` to
  // prevent returning `[null]`.
  if (typeof rawJSONString === "string") {
    try {
      results = JSON.parse(rawJSONString).slice(0, 4);
    } catch {}
  }
  return results.length > 0 ? results : null;
}

import type { TracksSortOptions } from "~/data/types";
import { viewPreferenceStore } from "~/stores/ViewPreference/store";
import type { SortOption } from "~/stores/ViewPreference/constants";
import type { MutableTrackOrder } from "~/stores/ViewPreference/types";

import { structuredTracksView } from "./views";

import { iAsc, iDesc } from "~/lib/drizzle";

export function getTracksOrderedBy<TScreen extends MutableTrackOrder>(
  screen: TScreen,
  sortOptions?: TracksSortOptions<TScreen>,
) {
  const isAsc =
    sortOptions?.isAsc ?? viewPreferenceStore.getState()[`${screen}IsAsc`];
  const order: SortOption =
    sortOptions?.order ?? viewPreferenceStore.getState()[`${screen}Order`];

  //? Determine field we'll sort by.
  const sortField =
    order === "artistName"
      ? structuredTracksView.artistsName
      : structuredTracksView[order];

  return isAsc ? iAsc(sortField) : iDesc(sortField);
}

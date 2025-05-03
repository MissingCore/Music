import type { SheetDefinition } from "react-native-actions-sheet";
import { registerSheet } from "react-native-actions-sheet";

import MinDurationSheet from "./MinDuration";
import PlaybackOptionsSheet from "./PlaybackOptions";
import ScanFilterListSheet from "./ScanFilterList";
import TrackSheet from "./Track";
import TrackSortSheet from "./TrackSort";
import TrackToPlaylistSheet from "./TrackToPlaylist";
import TrackUpcomingSheet from "./TrackUpcoming";

/*
  Note: Our sheets need to always render some (ie: not `null`). If we
  return `null` due waiting for data (ie: React Query), when the data
  appears, the sheet won't render as it expects a sheet on initial render.
*/
registerSheet("MinDurationSheet", MinDurationSheet);
registerSheet("PlaybackOptionsSheet", PlaybackOptionsSheet);
registerSheet("ScanFilterListSheet", ScanFilterListSheet);
registerSheet("TrackSheet", TrackSheet);
registerSheet("TrackSortSheet", TrackSortSheet);
registerSheet("TrackToPlaylistSheet", TrackToPlaylistSheet);
registerSheet("TrackUpcomingSheet", TrackUpcomingSheet);

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module "react-native-actions-sheet" {
  interface Sheets {
    MinDurationSheet: SheetDefinition;
    PlaybackOptionsSheet: SheetDefinition;
    ScanFilterListSheet: SheetDefinition<{
      payload: { listType: "listAllow" | "listBlock" };
    }>;
    TrackSheet: SheetDefinition<{ payload: { id: string } }>;
    TrackSortSheet: SheetDefinition;
    TrackToPlaylistSheet: SheetDefinition<{ payload: { id: string } }>;
    TrackUpcomingSheet: SheetDefinition;
  }
}

export {};

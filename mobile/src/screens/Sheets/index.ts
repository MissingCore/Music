import type { SheetDefinition } from "react-native-actions-sheet";
import { registerSheet } from "react-native-actions-sheet";

import PlaybackOptionsSheet from "./PlaybackOptions";
import TrackSheet from "./Track";
import TrackToPlaylistSheet from "./TrackToPlaylist";
import TrackUpcomingSheet from "./TrackUpcoming";

/*
  Note: Our sheets need to always render some (ie: not `null`). If we
  return `null` due waiting for data (ie: React Query), when the data
  appears, the sheet won't render as it expects a sheet on initial render.
*/
registerSheet("PlaybackOptionsSheet", PlaybackOptionsSheet);
registerSheet("TrackSheet", TrackSheet);
registerSheet("TrackToPlaylistSheet", TrackToPlaylistSheet);
registerSheet("TrackUpcomingSheet", TrackUpcomingSheet);

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module "react-native-actions-sheet" {
  interface Sheets {
    PlaybackOptionsSheet: SheetDefinition;
    TrackSheet: SheetDefinition<{ payload: { id: string } }>;
    TrackToPlaylistSheet: SheetDefinition<{ payload: { id: string } }>;
    TrackUpcomingSheet: SheetDefinition;
  }
}

export {};

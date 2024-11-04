import type { SheetDefinition } from "react-native-actions-sheet";
import { registerSheet } from "react-native-actions-sheet";

import BackupSheet from "./Backup";
import FontSheet from "./Font";
import LanguageSheet from "./Language";
import ThemeSheet from "./Theme";
import TrackSheet from "./Track";
import TrackSortSheet from "./TrackSort";
import TrackToPlaylistSheet from "./TrackToPlaylist";

/*
  Note: Our sheets need to always render some (ie: not `null`). If we
  return `null` due waiting for data (ie: React Query), when the data
  appears, the sheet won't render as it expects a sheet on initial render.
*/
registerSheet("backup-sheet", BackupSheet);
registerSheet("font-sheet", FontSheet);
registerSheet("language-sheet", LanguageSheet);
registerSheet("theme-sheet", ThemeSheet);
registerSheet("track-sheet", TrackSheet);
registerSheet("track-sort-sheet", TrackSortSheet);
registerSheet("track-to-playlist-sheet", TrackToPlaylistSheet);

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module "react-native-actions-sheet" {
  interface Sheets {
    "backup-sheet": SheetDefinition;
    "font-sheet": SheetDefinition;
    "language-sheet": SheetDefinition;
    "theme-sheet": SheetDefinition;
    "track-sheet": SheetDefinition<{ payload: { id: string } }>;
    "track-sort-sheet": SheetDefinition;
    "track-to-playlist-sheet": SheetDefinition<{ payload: { id: string } }>;
  }
}

export {};

import type { SheetDefinition } from "react-native-actions-sheet";
import { registerSheet } from "react-native-actions-sheet";

import AddMusicSheet from "./AddMusic";
import { ArtistArtworkSheet, PlaylistArtworkSheet } from "./Artwork";
import BackupSheet from "./Backup";
import FontSheet from "./Font";
import LanguageSheet from "./Language";
import MinDurationSheet from "./MinDuration";
import NowPlayingDesignSheet from "./NowPlayingDesign";
import ScanFilterListSheet from "./ScanFilterList";
import ThemeSheet from "./Theme";
import TrackSheet from "./Track";
import TrackSortSheet from "./TrackSort";
import TrackToPlaylistSheet from "./TrackToPlaylist";
import TrackUpcomingSheet from "./TrackUpcoming";

import type { SearchCallbacks } from "@/modules/search/types";

/*
  Note: Our sheets need to always render some (ie: not `null`). If we
  return `null` due waiting for data (ie: React Query), when the data
  appears, the sheet won't render as it expects a sheet on initial render.
*/
registerSheet("AddMusicSheet", AddMusicSheet);
registerSheet("ArtistArtworkSheet", ArtistArtworkSheet);
registerSheet("BackupSheet", BackupSheet);
registerSheet("FontSheet", FontSheet);
registerSheet("LanguageSheet", LanguageSheet);
registerSheet("MinDurationSheet", MinDurationSheet);
registerSheet("NowPlayingDesignSheet", NowPlayingDesignSheet);
registerSheet("PlaylistArtworkSheet", PlaylistArtworkSheet);
registerSheet("ScanFilterListSheet", ScanFilterListSheet);
registerSheet("ThemeSheet", ThemeSheet);
registerSheet("TrackSheet", TrackSheet);
registerSheet("TrackSortSheet", TrackSortSheet);
registerSheet("TrackToPlaylistSheet", TrackToPlaylistSheet);
registerSheet("TrackUpcomingSheet", TrackUpcomingSheet);

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module "react-native-actions-sheet" {
  interface Sheets {
    AddMusicSheet: SheetDefinition<{
      payload: { callbacks: Pick<SearchCallbacks, "album" | "track"> };
    }>;
    ArtistArtworkSheet: SheetDefinition<{ payload: { id: string } }>;
    BackupSheet: SheetDefinition;
    FontSheet: SheetDefinition;
    LanguageSheet: SheetDefinition;
    MinDurationSheet: SheetDefinition;
    NowPlayingDesignSheet: SheetDefinition;
    PlaylistArtworkSheet: SheetDefinition<{ payload: { id: string } }>;
    ScanFilterListSheet: SheetDefinition<{
      payload: { listType: "listAllow" | "listBlock" };
    }>;
    ThemeSheet: SheetDefinition;
    TrackSheet: SheetDefinition<{ payload: { id: string } }>;
    TrackSortSheet: SheetDefinition;
    TrackToPlaylistSheet: SheetDefinition<{ payload: { id: string } }>;
    TrackUpcomingSheet: SheetDefinition;
  }
}

export {};

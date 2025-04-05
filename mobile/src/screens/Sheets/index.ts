import type { SheetDefinition } from "react-native-actions-sheet";
import { registerSheet } from "react-native-actions-sheet";

import {
  AlbumArtworkSheet,
  ArtistArtworkSheet,
  PlaylistArtworkSheet,
} from "./Artwork";
import TrackSheet from "./Track";
import TrackToPlaylistSheet from "./TrackToPlaylist";

/*
  Note: Our sheets need to always render some (ie: not `null`). If we
  return `null` due waiting for data (ie: React Query), when the data
  appears, the sheet won't render as it expects a sheet on initial render.
*/
registerSheet("AlbumArtworkSheet", AlbumArtworkSheet);
registerSheet("ArtistArtworkSheet", ArtistArtworkSheet);
registerSheet("PlaylistArtworkSheet", PlaylistArtworkSheet);
registerSheet("TrackSheet", TrackSheet);
registerSheet("TrackToPlaylistSheet", TrackToPlaylistSheet);

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module "react-native-actions-sheet" {
  interface Sheets {
    AlbumArtworkSheet: SheetDefinition<{ payload: { id: string } }>;
    ArtistArtworkSheet: SheetDefinition<{ payload: { id: string } }>;
    PlaylistArtworkSheet: SheetDefinition<{ payload: { id: string } }>;
    TrackSheet: SheetDefinition<{ payload: { id: string } }>;
    TrackToPlaylistSheet: SheetDefinition<{ payload: { id: string } }>;
  }
}

export {};

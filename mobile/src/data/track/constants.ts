import {
  tracksToArtists,
  tracksToGenres,
  tracksToLyrics,
  tracksToPlaylists,
  waveformSamples,
} from "~/db/schema";

export const TrackRelationTables = [
  tracksToArtists,
  tracksToGenres,
  tracksToLyrics,
  tracksToPlaylists,
  waveformSamples,
];

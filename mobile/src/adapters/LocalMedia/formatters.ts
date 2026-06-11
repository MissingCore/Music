import { AlbumArtistsKey } from "~/data/album/utils";

import { Protocol } from "../core/constants";

import type {
  AlbumListsResult,
  SharedTrackColumn,
  StructuredTracksResult,
} from "./views";

const _AdapterProtocol = Protocol.LOCAL;

//#region Primitive Formatters
type SchemaBase = { id?: string; name: string; artwork: string | null };
type ListBase = { duration: string | null; trackCount: number };

export function toBaseSchemaObject(data: SchemaBase) {
  return {
    id: data.id ?? data.name,
    protocol: _AdapterProtocol,
    name: data.name,
    artworkSrc: data.artwork,
  };
}

/** Reformats data used in a list to its shared repesentation. */
export function toBaseListObject(data: SchemaBase & ListBase) {
  return {
    ...toBaseSchemaObject(data),
    duration: Number(data.duration) || 0,
    trackCount: data.trackCount,
  };
}
//#endregion

//#region Album Formatters
export function toAlbumListObject(data: AlbumListsResult) {
  let yearStr: string | null = null;
  if (data.minYear !== null && data.maxYear !== null) {
    if (data.minYear === data.maxYear) yearStr = `${data.maxYear}`;
    else yearStr = `${data.minYear} - ${data.maxYear}`;
  }

  return {
    ...toBaseListObject(data),
    year: yearStr,
    artist: AlbumArtistsKey.toString(data.artistsKey),
    artists: AlbumArtistsKey.deconstruct(data.artistsKey).map((name) => {
      return { id: name, name };
    }),
    isFavorite: data.isFavorite,
  };
}
//#endregion

//#region Track Formatters
/** Reformats track data to its shared repesentation. */
export function toBaseTrackObject(
  data: Pick<StructuredTracksResult, SharedTrackColumn>,
) {
  let trackArtists: string[] | null = null;
  try {
    if (data.artists) trackArtists = JSON.parse(data.artists) as string[];
  } catch {}

  return {
    ...toBaseSchemaObject(data),
    src: data.uri,
    duration: data.duration,
    artist: data.artistsName,
    artists:
      trackArtists && trackArtists.length > 0
        ? trackArtists.map((name) => ({ id: name, name }))
        : null,
    album: data.albumName,
    albumId: data.albumId,
    discoverTime: data.discoverTime,
    modificationTime: data.modificationTime,
    parent: data.parentFolder,
  };
}
//#endregion

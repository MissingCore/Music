import { ID3Reader } from "./ID3Reader";

type MetadataResult = {
  name: string;
  artist: string;
  album: string | null;
  track: number | null;
  year: number | null;
};

type CoverResult = { cover: string | null };

/**
 * @description Get metadata for MP3 files using ID3v2.3 & ID3v2.4 without
 *  flags & stored at the start of the file.
 *  - The 2nd argument is a boolean that returns only the non-image
 *  content if `true`. If `false`, returns only the image.
 */
export async function getMusicInfoAsync<T extends boolean>(
  uri: string,
  metadataOnly: T,
) {
  return (await new ID3Reader(
    uri,
    metadataOnly,
  ).getMetadata()) as unknown as T extends true
    ? Promise<MetadataResult>
    : Promise<CoverResult>;
}

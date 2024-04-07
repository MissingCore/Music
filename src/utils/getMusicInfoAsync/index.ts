import { ID3Reader } from "./ID3Reader";

/**
 * @description Get metadata for MP3 files using ID3v2.3 & ID3v2.4 without
 *  flags & stored at the start of the file.
 */
export async function getMusicInfoAsync(uri: string) {
  return await new ID3Reader(uri).getMetadata();
}

import { decode as atob, encode as btoa } from "base-64";
import * as FileSystem from "expo-file-system";

import Buffer from "./Buffer";
import { arrayIncludes } from "../array";

/*
  References:
    - https://gigamonkeys.com/book/practical-an-id3-parser
    - https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-structure.html
    - https://github.com/MehrabSp/expo-music-info-2
*/

const BUFFER_SIZE = 256 * 1024;

/* 
  Frame ids for ID3v2.3 & ID3v2.4 tags
    - https://www.exiftool.org/TagNames/ID3.html
    - https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-frames.html
*/
const FrameTypes = {
  // `TYER` is ID3v2.3 "Year" & `TDRC` is ID3v2.4 "Recording Time"
  text: ["TIT2", "TPE1", "TALB", "TRCK", "TYER", "TDRC"],
  picture: ["APIC"],
} as const;

type TextFrameId = (typeof FrameTypes.text)[number];
type PictureFrameId = (typeof FrameTypes.picture)[number];

/**
 * @description Get metadata for MP3 files using ID3v2.3 & ID3v2.4 without
 *  flags & stored at the start of the file.
 */
export async function getMusicInfoAsync(uri: string) {
  return await new ID3Reader(uri).getMetadata();
}

/**
 * @description Class containing the logic to read ID3v2.3 & ID3v2.4 tags
 *  (without flags) that are stored at the beginning of the file.
 */
class ID3Reader {
  fileUri = "";
  dataSize = 0;

  buffer = new Buffer();
  frames = {} as Record<TextFrameId | PictureFrameId, string | undefined>;

  filePosition = 0;
  version = 0; // The minor version of the spec (should be `3` or `4`).
  finished = false;

  constructor(uri: string) {
    this.fileUri = uri;
  }

  /** Read a chunk of the base64 representation of the MP3 file. */
  async loadFileToBuffer() {
    const data = await FileSystem.readAsStringAsync(this.fileUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: this.filePosition,
      length: BUFFER_SIZE,
    });
    // Convert base64 to Typed Array (byte array).
    //  - Uint8Array is better for runtime performance
    this.buffer.setBuffer(Uint8Array.from(atob(data), (c) => c.charCodeAt(0)));
    this.filePosition += BUFFER_SIZE;
  }

  /** Get MP3 metadata. */
  async getMetadata() {
    const fileInfo = await FileSystem.getInfoAsync(this.fileUri);
    // File should exist, so below error shouldn't be thrown.
    if (!fileInfo.exists) throw new Error("File doesn't exist.");
    this.dataSize = fileInfo.size;

    try {
      // Process the file (ID3 Tag Header & Frames).
      await this.processHeader();
      while (!this.finished) await this.processFrame();

      // Return the results.
      const { APIC, TALB, TDRC, TIT2, TPE1, TRCK, TYER } = this.frames;
      return {
        title: TIT2,
        artist: TPE1,
        album: TALB,
        track: Number(TRCK) || undefined,
        year: Number(TYER || TDRC?.slice(0, 4)) || undefined,
        cover: APIC,
      };
    } catch (err) {
      if (err instanceof InvalidFileException) return null;
      else throw err;
    }
  }

  /** Returns an array of bytes from the buffer. */
  async read(length: number) {
    const chunk = Array.from(this.buffer.readBytes(length));
    let chunkConcat: Array<number> | null = null;
    const remaining = length - chunk.length;
    if (remaining > 0 && !this.trulyFinished) {
      await this.loadFileToBuffer();
      // To prevent "maximum call stack size exceeded"
      chunkConcat = chunk.concat(Array.from(this.buffer.readBytes(remaining)));
    }
    return chunkConcat || chunk;
  }

  /** Read buffer until we hit a `null`. */
  async readTilNull() {
    let byte: number | null = null;
    const chunk = [];
    while (byte != 0) {
      if (this.buffer.eof) {
        if (this.trulyFinished) break;
        await this.loadFileToBuffer();
      }
      byte = this.buffer.readUInt8();
      chunk.push(byte);
    }
    return chunk;
  }

  /** Skip bytes in the buffer. */
  async skip(length: number) {
    const remaining = length - this.buffer.move(length);
    if (remaining > 0 && !this.trulyFinished) {
      this.filePosition += remaining;
      await this.loadFileToBuffer();
    }
  }

  /** Read information in the header of an ID3 tag (first 10 bytes). */
  async processHeader() {
    // First 3 bytes of the header should encode the string "ID3".
    let chunk = await this.read(3);
    if (this.bytesToString(chunk) !== "ID3") throw new InvalidFileException();

    // Next 2 bytes encodes the major version & revision of the ID3 specification.
    chunk = await this.read(2);
    this.version = this.bytesToInt([chunk[0]]);
    if (this.version === 2) throw new InvalidFileException(); // Throw error for ID3v2.2

    // Next byte is treated as flags.
    await this.skip(1);

    // Last 4 bytes in header gives the total size of the tag excluding
    // the header (stored as a 32 bit synchsafe integer).
    chunk = await this.read(4);
    this.dataSize = this.bytesToInt(chunk, 7);
  }

  /** Process a frame (tag data is divided into frames). */
  async processFrame() {
    // First 4 bytes is frame header.
    let chunk = await this.read(4);
    const frameId = this.bytesToString(chunk);

    // We hit the "padding" in the tag data when we get a `null` byte
    // where we expect a frame identifier.
    if (frameId === "") this.finished = true;
    else {
      // Next 4 bytes is the frame size (excludes the 10 bytes in frame header).
      chunk = await this.read(4);
      const frameSize = this.bytesToSize(chunk);

      // Next 2 bytes are treated as flags.
      await this.skip(2);

      // Process the frame once we identify the frame type.
      if (arrayIncludes(FrameTypes.text, frameId)) {
        await this.processTextFrame(frameId, frameSize);
      } else if (arrayIncludes(FrameTypes.picture, frameId)) {
        await this.processPictureFrame(frameSize);
      } else {
        await this.skip(frameSize);
      }

      // Exit early as we got all the data we needed.
      if (Object.keys(this.frames).length == 6) this.finished = true;
    }
  }

  /** Returns a string represented by the contents of a text frame. */
  async processTextFrame(frameId: TextFrameId, frameSize: number) {
    // First byte indicates text encoding.
    await this.skip(1);
    const chunk = await this.read(frameSize - 1);
    this.frames[frameId] = this.bytesToString(chunk);
  }

  /** Returns the description & base64 representation of the image. */
  async processPictureFrame(frameSize: number) {
    // First byte indicates text encoding.
    await this.skip(1);

    // Get MIME Type (field is of unknown length & ends with a `null`)
    let chunk = await this.readTilNull();
    const mimeType = this.bytesToString(chunk);

    // Next byte indicates picture type
    await this.skip(1);

    let pictureDataSize = frameSize - chunk.length - 2;
    // Get description (field is of unknown length & ends with a `null`)
    //  - We won't use this value
    chunk = await this.readTilNull();
    pictureDataSize -= chunk.length;

    const pictureData = await this.read(pictureDataSize);
    this.frames.APIC = `data:${mimeType};base64,${this.bytesToBase64(pictureData)}`;
  }

  /** Boolean whether we finished reading all data in the file. */
  get trulyFinished() {
    if (this.filePosition < this.dataSize) return false;
    this.finished = true;
    return true;
  }

  /* Helpful conversion functions for byte arrays. */
  bytesToString(bytes: number[]) {
    // Include a limited set of characters from the ASCII table (ie: ignore `NUL`).
    return String.fromCharCode(...bytes.filter((b) => b >= 32 && b <= 126));
  }

  bytesToInt(bytes: number[], bitsUsed = 8) {
    return bytes
      .toReversed()
      .reduce((num, byte, idx) => (num |= byte << (idx * bitsUsed)), 0);
  }

  bytesToSize(bytes: number[]) {
    // ID3v2.3 frame size isn't stored as a 32 bit synchsafe integer (unlike ID3v2.4).
    //  - https://hydrogenaud.io/index.php/topic,67145.msg602034.html#msg602034
    if (this.version == 3) return this.bytesToInt(bytes);
    else return this.bytesToInt(bytes, 7);
  }

  bytesToBase64(bytes: number[]) {
    return btoa(bytes.reduce((s, byte) => s + String.fromCharCode(byte), ""));
  }
}

/**
 * @description Class representing error thrown when we get an invalid
 *  audio file or a file where the ID3 tag doesn't start at the beginning.
 */
class InvalidFileException extends Error {
  constructor() {
    super();
    this.name = "InvalidFileException";
    this.message = "Invalid file format.";
  }
}

/** @description Subclass of Uint8Array. */
export default class Buffer {
  #buffer: Uint8Array = new Uint8Array();
  #cursor = 0;

  /** Set the buffer and reset the cursor. */
  setBuffer(buffer: Uint8Array) {
    this.#buffer = buffer;
    this.#cursor = 0;
  }

  /** Get stored buffer. */
  get buffer() {
    return this.#buffer;
  }

  /** Whether the current position is at the end of the buffer. */
  get eof() {
    return this.#cursor >= this.length;
  }

  /** Length/size of the buffer. */
  get length() {
    return this.#buffer.length;
  }

  /** Current buffer cursor position. */
  get position() {
    return this.#cursor;
  }

  /** Move cursor by offset, returning the amount traversed. */
  move(offset: number) {
    const start = this.#cursor;
    this.#cursor = start + offset > this.length ? this.length : start + offset;
    return this.#cursor - start; // "Ending Position" - "Prev Position"
  }

  /** Reads 1 byte and increment cursor. */
  readUInt8() {
    return this.#buffer[this.#cursor++];
  }

  /** Read the specified number of bytes, or the amount until we hit the `eof`. */
  readBytes(length: number) {
    const start = this.#cursor;
    return this.#buffer.slice(start, start + this.move(length));
  }
}

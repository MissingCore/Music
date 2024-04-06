/**
 * @description Class representing error thrown when we get an invalid
 *  audio file or a file where the ID3 tag doesn't start at the beginning.
 */
export default class InvalidFileException extends Error {
  constructor() {
    super();
    this.name = "InvalidFileException";
    this.message = "Invalid file format.";
  }
}

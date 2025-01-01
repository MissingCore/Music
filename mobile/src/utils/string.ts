/** Ensure a path ends with a trailing forward slash. */
export function addTrailingSlash(path: string) {
  return path.endsWith("/") ? path : `${path}/`;
}

/** Removes the file extension from a filename. */
export function removeFileExtension(filename: string) {
  return filename.split(".").slice(0, -1).join(".");
}

/** @description Capitalize first letter of string. */
export function capitalize<T extends string>(str: T) {
  return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>;
}

/** Type-safe `String.prototype.toLowerCase()`. */
export function toLowerCase<T extends string>(str: T) {
  return str.toLowerCase() as Lowercase<T>;
}

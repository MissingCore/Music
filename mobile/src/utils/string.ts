import type { Maybe } from "./types";

/** Ensure a path ends with a trailing forward slash. */
export function addTrailingSlash(path: string) {
  return path.endsWith("/") ? path : `${path}/`;
}

/** Sort strings in ascending order, accounting for `undefined` values. */
export function compareAsc(a: Maybe<string>, b: Maybe<string>) {
  if (!a) return -1;
  if (!b) return 1;
  return a.localeCompare(b);
}

/** Removes the file extension from a filename. */
export function removeFileExtension(filename: string) {
  return filename.split(".").slice(0, -1).join(".");
}

/** Type-safe `String.prototype.toLowerCase()`. */
export function toLowerCase<T extends string>(str: T) {
  return str.toLowerCase() as Lowercase<T>;
}

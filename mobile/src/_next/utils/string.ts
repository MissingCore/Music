// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

/** Returns the name of a file with its extension from a uri. */
export function getFileName(uri: string) {
  return uri.split("/").at(-1);
}

export function removeFileExtension(filename: string) {
  const segments = filename.split(".");
  if (segments.length === 1) return segments[0]!.trim();
  return segments.slice(0, -1).join(".").trim();
}

/** Type-safe `String.prototype.toLowerCase()`. */
export function toLowerCase<T extends string>(str: T) {
  return str.toLowerCase() as Lowercase<T>;
}

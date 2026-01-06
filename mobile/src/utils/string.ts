/** Ensure a path ends with a trailing forward slash. */
export function addTrailingSlash(path: string) {
  return path.endsWith("/") ? path : `${path}/`;
}

/** Remove the forward slash at the front of the path. */
export function removeLeadingSlash(path: string) {
  return path.startsWith("/") ? path.slice(1) : path;
}

/** Removes the file extension from a filename. */
export function removeFileExtension(filename: string) {
  return filename.split(".").slice(0, -1).join(".").trim();
}

/** @description Capitalize first letter of string. */
export function capitalize<T extends string>(str: T) {
  return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>;
}

/** Type-safe `String.prototype.toLowerCase()`. */
export function toLowerCase<T extends string>(str: T) {
  return str.toLowerCase() as Lowercase<T>;
}

/** Returns a string that safely handles special characters such as "%", "?", and "#". */
export function getSafeUri(uri: string) {
  // It's important to replace the "%" first as if we put it later on, it'll
  // break the decoding for "?" & "#".
  return uri
    .replaceAll("%", "%25")
    .replaceAll("?", "%3F")
    .replaceAll("#", "%23")
    .replaceAll("[", "%5B")
    .replaceAll("]", "%5D");
}

/** Recursively split string by specified separators. */
export function splitOn(str: string, separators: string[]) {
  const usedSeparators = separators.filter((separator) =>
    str.includes(separator),
  );
  if (usedSeparators.length === 0) return [str];

  let splittedStr = [str];

  for (const separator of usedSeparators) {
    const updatedSplittedStr: string[] = [];
    for (const chunk of splittedStr) {
      for (const segment of chunk.split(separator)) {
        updatedSplittedStr.push(segment.trim());
      }
    }
    splittedStr = updatedSplittedStr;
  }

  return splittedStr;
}

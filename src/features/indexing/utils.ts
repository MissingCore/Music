/** Ensure a path ends with a trailing forward slash. */
export function addTrailingSlash(path: string) {
  return path.endsWith("/") ? path : `${path}/`;
}

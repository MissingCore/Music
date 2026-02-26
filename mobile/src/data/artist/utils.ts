import type { Maybe } from "~/utils/types";

/** Generate a string listing out all the artists. */
export function getArtistsString<TFallback extends Maybe<string> = "—">(
  artists: string[] | null,
  fallback?: TFallback,
) {
  const fallbackStr = fallback === undefined ? "—" : fallback;
  return (artists?.join(", ") || fallbackStr) as TFallback extends null
    ? string | null
    : string;
}

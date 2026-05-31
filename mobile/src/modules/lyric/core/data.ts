import { getArtistsString } from "~/data/artist/utils";
import type { Track } from "~/data/track/types";

import { APP_VERSION } from "~/constants/Config";
import { Links } from "~/lib/web-browser";
import type { LyricProvider } from "./constants";

export async function fetchLyricFromProvider(
  track: Track,
  { endpoint, httpHeaders, responseType, traversal }: LyricProvider,
): Promise<string | null> {
  const isTextOutput = responseType === "string";

  const response = await fetch(populateEndpointString(track, endpoint), {
    headers: {
      ...Object.fromEntries(httpHeaders),
      "Content-Type": isTextOutput ? "text/plain" : "application/json",
      "User-Agent": `MissingCore Music ${APP_VERSION} (${Links.GitHub})`,
    },
  });
  if (!response.ok) return null;
  const data = await (isTextOutput ? response.text() : response.json());

  if (isTextOutput) return data || null;

  try {
    // Expected to be some kind of object.
    let traversalObj = responseType === "array" ? data[0] : data;

    for (const { field, type } of traversal) {
      traversalObj =
        type === "array" ? traversalObj[field][0] : traversalObj[field];
    }

    return typeof traversalObj === "string" ? traversalObj : null;
  } catch {
    return null;
  }
}

export function populateEndpointString(track: Track, endpoint: string) {
  const { name, artists, albumName, duration } = track;
  return endpoint
    .replace("%name%", encodeURIComponent(name))
    .replace("%artistName%", encodeURIComponent(getArtistsString(artists, "")))
    .replace("%albumName%", encodeURIComponent(albumName ?? ""))
    .replace("%duration%", `${Math.round(duration)}`);
}

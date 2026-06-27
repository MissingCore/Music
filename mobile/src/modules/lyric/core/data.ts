// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { getArtistsString } from "~/data/artist/utils";
import type { Track } from "~/data/track/types";

import { APP_VERSION } from "~/constants/Config";
import { Links } from "~/lib/web-browser";
import type { LyricProvider } from "./constants";

export async function fetchLyricFromProvider(
  track: Track,
  { endpoint, headers, isJSONResponse, traversedFields }: LyricProvider,
  abortController: AbortController,
): Promise<string | null> {
  const response = await fetch(populateEndpointString(track, endpoint), {
    headers: HTTPHeaders.merge(HTTPHeaders.parse(headers), {
      "Content-Type": isJSONResponse ? "application/json" : "text/plain",
      "User-Agent": `MissingCore Music ${APP_VERSION} (${Links.GitHub})`,
    }),
    signal: abortController.signal,
  });
  if (!response.ok) return null;
  const data = await (isJSONResponse ? response.json() : response.text());

  // Return response as we expect it to be a string.
  if (!isJSONResponse) return data || null;

  try {
    // Expected to be an object.
    let traversalObj = Array.isArray(data) ? data[0] : data;

    // Traverse the object based on the keys. If we end up with an array,
    // return the 1st item (we expect it to be an object).
    for (const fieldName of traversedFields) {
      traversalObj = traversalObj[fieldName];
      if (Array.isArray(traversalObj)) traversalObj = traversalObj[0];
    }

    return typeof traversalObj === "string" ? traversalObj : null;
  } catch (err) {
    console.log(err);
    return null;
  }
}

/** A list of helpers for creating an HTTP `Headers` object. */
export const HTTPHeaders = {
  /** Merge in an object of "headers". This is due to the keys in `Headers` being normalized. */
  merge: (headers: Headers, additionalHeaders: Record<string, string>) => {
    for (const [key, value] of Object.entries(additionalHeaders)) {
      headers.set(key, value);
    }
    return headers;
  },
  /** Parse a list of "Key: Value" pairs. */
  parse: (headers: string) => {
    return new Headers(
      headers
        .split("\n")
        .map((entry) => {
          const trimmedValue = entry.trim();
          if (!trimmedValue) return undefined;
          const [_key, ..._value] = trimmedValue.split(":");
          const key = _key?.trim();
          const value = _value.join(":").trim();
          if (!key || !value) return undefined;
          return [key, value] satisfies [string, string];
        })
        .filter((entry) => entry !== undefined),
    );
  },
};

/** Replace placeholders in the API endpoint string. */
export function populateEndpointString(track: Track, endpoint: string) {
  const { name, artists, albumName, duration } = track;
  return endpoint
    .replace("%name%", encodeURIComponent(name))
    .replace("%artistName%", encodeURIComponent(getArtistsString(artists, "")))
    .replace("%albumName%", encodeURIComponent(albumName ?? ""))
    .replace("%duration%", `${Math.round(duration)}`);
}

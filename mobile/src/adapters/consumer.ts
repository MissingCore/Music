import type { MediaLibrary } from "./core/types";
import { ExampleAdapter } from "./Example";
import { LocalMediaAdapter } from "./LocalMedia";

import { isFulfilled } from "~/utils/promise";

const Adapters = [LocalMediaAdapter, ExampleAdapter];

export async function getGenres() {
  const results = await Promise.allSettled(Adapters.map((a) => a.getGenres()));
  const adapterResults = results.filter(isFulfilled).map((r) => r.value);

  // Genres are one of the lists we'll support merging content.
  const mergeMap: Record<
    string,
    { data: MediaLibrary.Genre; adapters: Record<string, string> }
  > = {};

  for (const adapterResult of adapterResults) {
    for (const entry of adapterResult) {
      if (mergeMap[entry.name] === undefined) {
        mergeMap[entry.name] = {
          data: entry,
          adapters: { [entry.protocol]: entry.id },
        };
      } else {
        const prevData = mergeMap[entry.name]!.data;
        mergeMap[entry.name]!.data = {
          ...prevData,
          ...(!prevData.artworkSrc ? { artworkSrc: entry.artworkSrc } : {}),
          duration: prevData.duration + entry.duration,
          trackCount: prevData.trackCount + entry.trackCount,
        };
        mergeMap[entry.name]!.adapters[entry.protocol] = entry.id;
      }
    }
  }

  return Object.entries(mergeMap)
    .map(([name, { data, adapters }]) => ({
      ...data,
      route: `/${name}?${Object.entries(adapters)
        .map(([protocol, id]) => `${protocol}=${encodeURIComponent(id)}`)
        .join("&")}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

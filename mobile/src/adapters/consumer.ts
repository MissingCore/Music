import i18next from "~/modules/i18n";

import { Protocol } from "./core/constants";
import type { Adapter, AdapterProtocol, MediaLibrary } from "./core/types";
import { ExampleAdapter } from "./Example";
import { LocalMediaAdapter } from "./LocalMedia";

import { isFulfilled } from "~/utils/promise";

const Adapters = [LocalMediaAdapter, ExampleAdapter];
const AdapterMap: Record<AdapterProtocol, Adapter> = {
  [Protocol.EXAMPLE]: ExampleAdapter,
  [Protocol.LOCAL]: LocalMediaAdapter,
};

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

export async function getGenre(route: string) {
  // `params` should be in the form of: `:screenId?adapter1=value&adapter2=value`
  const usedAdapters = Array.from(
    new URLSearchParams(route.split("?").at(-1)).entries(),
  );
  const results = await Promise.allSettled(
    usedAdapters.map(([adapterKey, id]) =>
      AdapterMap[adapterKey as AdapterProtocol].getGenre(id),
    ),
  );
  const adapterResults = results.filter(isFulfilled).map((r) => r.value);

  // If no adapter return results, throw an error.
  if (adapterResults.length === 0)
    throw new Error(i18next.t("err.msg.noGenres"));

  const merged = adapterResults.shift()!;
  for (const entry of adapterResults) {
    if (!merged.artworkSrc) merged.artworkSrc = entry.artworkSrc;
    merged.duration += entry.duration;
    merged.trackCount += entry.trackCount;
    merged.tracks = merged.tracks.concat(entry.tracks);
  }

  // Sort the tracks.
  merged.tracks.sort((a, b) => a.name.localeCompare(b.name));

  return merged;
}

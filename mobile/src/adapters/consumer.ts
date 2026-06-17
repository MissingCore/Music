import i18next from "~/modules/i18n";
import type { TracksSortOptions } from "~/data/types";

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
      // Generates the segment after `/genre`.
      route: createRouteFromAdapters(name, adapters),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getGenre(route: string) {
  const results = await Promise.allSettled(
    extractAdapters(route).map(([adapterKey, id]) =>
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
  }

  return merged;
}

export async function getGenreTracks(
  route: string,
  sortOptions?: TracksSortOptions<"genreTracks">,
) {
  const results = await Promise.allSettled(
    extractAdapters(route).map(([adapterKey, id]) =>
      AdapterMap[adapterKey as AdapterProtocol].getGenreTracks(id, sortOptions),
    ),
  );
  const adapterResults = results.filter(isFulfilled).map((r) => r.value);

  // If no adapter return results, throw an error.
  if (adapterResults.length === 0)
    throw new Error(i18next.t("err.msg.noGenres"));

  let mergedTracks = adapterResults.shift()!;
  for (const adaptertracks of adapterResults) {
    mergedTracks = mergedTracks.concat(adaptertracks);
  }

  //! Be extremely lazy and just join the sorted results without sorting.
  return mergedTracks;
}

//#region Helper Functions
function createRouteFromAdapters(
  routeName: string,
  adapters: Record<AdapterProtocol, string>,
) {
  return `/${routeName}?${Object.entries(adapters)
    .map(([protocol, id]) => `${protocol}=${encodeURIComponent(id)}`)
    .join("&")}`;
}

function extractAdapters(route: string): Array<[AdapterProtocol, string]> {
  // `route` should be in the form of: `:screenId?adapter1=value&adapter2=value`
  return Array.from(
    new URLSearchParams(route.split("?").at(-1)).entries(),
  ) as Array<[AdapterProtocol, string]>;
}
//#endregion

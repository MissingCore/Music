// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";

import { queries as q } from "../keyStore";

import { getImageUri } from "~/lib/file-system";
import { createTextPlaceholder } from "~/components/next/blocks/media-image";

//#region Queries
export function useArtistDetails(artistName: string) {
  return useQuery({
    ...q.artists.detail(artistName),
    select: ({ topTracks, albums, eps, singles, artwork, ...rest }) => ({
      ...rest,
      imageSource: getImageUri(artwork) ?? createTextPlaceholder(rest.name),
      topTracks: topTracks.length > 0 ? topTracks : null,
      albums: albums.length > 0 ? albums : null,
      eps: eps.length > 0 ? eps : null,
      singles: singles.length > 0 ? singles : null,
    }),
  });
}

export function useArtists() {
  return useQuery({ ...q.artists.all });
}
//#endregion

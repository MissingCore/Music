// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { queries as q } from "../keyStore";

import { getImageUri } from "~/lib/file-system";
import { createTextPlaceholder } from "~/components/next/blocks/media-image";

//#region Queries
export function useArtistDetails(artistName: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.artists.detail(artistName),
    select: ({ numTracks, artwork, ...rest }) => ({
      ...rest,
      imageSource: getImageUri(artwork) ?? createTextPlaceholder(rest.name),
      metadata: [t("plural.track", { count: numTracks })],
    }),
  });
}

export function useArtists() {
  return useQuery({ ...q.artists.all });
}
//#endregion

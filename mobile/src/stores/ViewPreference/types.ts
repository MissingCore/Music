// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { MediaImageSrc } from "~/components/next/composed/media-image";

/** Screens where the layout of the content can be change. */
export type MutableViewLayout = "album" | "artist" | "genre" | "playlist";

/** Fields that get rendered in our mutable layout. */
export type LayoutItem = {
  id: string;
  title: string;
  description: string;
  imageSource: MediaImageSrc;
};

/** Options where the sort order will be applied to the tracks. */
export type MutableTrackOrder =
  "artistTracks" | "folder" | "genreTracks" | "track";

/** Screens where the order of the content can be change. */
export type MutableViewOrder =
  MutableTrackOrder | "album" | "artist" | "genre" | "playlist";

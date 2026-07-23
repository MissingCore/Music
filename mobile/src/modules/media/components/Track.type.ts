// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { Prettify } from "~/utils/types";
import type { SearchResult } from "~/modules/search/components/SearchResult";
import type { PlayFromSource } from "~/stores/Playback/types";

export type TrackContent = Required<
  Pick<SearchResult.Content, "title" | "description" | "imageSource">
> & { id: string };

export type TrackProps = Prettify<
  TrackContent & {
    /** Indicate that this track is being played. */
    showIndicator?: boolean;
    trackSource: PlayFromSource;
    Leading?: React.JSX.Element;
    /** Note: Maps to `wrapperClassName` on `<SearchResult />`. */
    className?: string;
  }
>;

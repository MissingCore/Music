// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { MediaType } from "~/stores/Playback/types";

export namespace MediaImage {
  export type ImageSource = string | null | Array<string | null>;

  export type ImageContent = { type: MediaType; source: ImageSource };

  export type ImageConfig = {
    size: number;
    className?: string;
    noPlaceholder?: boolean;
  };

  export type Props = ImageContent & ImageConfig;
}

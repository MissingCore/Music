// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Image as ExpoImage } from "expo-image";
import { withUniwind } from "uniwind";

import { usePreferenceStore } from "~/stores/Preference/store";

const WrappedImage = withUniwind(ExpoImage);

export function Image(props: React.ComponentProps<typeof WrappedImage>) {
  const squareArtwork = usePreferenceStore((s) => s.squareArtwork);
  return (
    <WrappedImage contentFit={squareArtwork ? "cover" : "contain"} {...props} />
  );
}

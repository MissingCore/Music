// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { ImageBackground as ExpoImageBackground } from "expo-image";
import { ScopedTheme, withUniwind } from "uniwind";

import { usePreferenceStore } from "~/stores/Preference/store";

import { getImageUri } from "~/lib/file-system";
import type { Maybe } from "~/utils/types";
import { DisableGradient } from "~/components/Gradient";

const ImageBackground = withUniwind(ExpoImageBackground);

export function AtmosphereBackground(props: {
  children: React.ReactNode;
  source: Maybe<string>;
}) {
  const atmosphereEffect = usePreferenceStore((s) => s.atmosphereEffect);

  if (!atmosphereEffect || !props.source) return props.children;
  return (
    <DisableGradient>
      <ScopedTheme theme="atmosphere">
        <ImageBackground source={getImageUri(props.source)} blurRadius={5}>
          {props.children}
        </ImageBackground>
      </ScopedTheme>
    </DisableGradient>
  );
}

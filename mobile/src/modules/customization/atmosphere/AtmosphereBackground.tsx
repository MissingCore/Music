// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Image as ExpoImage } from "expo-image";
import { useWindowDimensions } from "react-native";
import { ScopedTheme, withUniwind } from "uniwind";

import { usePreferenceStore } from "~/stores/Preference/store";

import { getImageUri } from "~/lib/file-system";
import type { Maybe } from "~/utils/types";
import { DisableGradient } from "~/components/Gradient";

const Image = withUniwind(ExpoImage);

export function AtmosphereBackground(props: {
  children: React.ReactNode;
  source: Maybe<string>;
}) {
  const dimensions = useWindowDimensions();
  const atmosphereEffect = usePreferenceStore((s) => s.atmosphereEffect);

  const imgSize = Math.max(dimensions.height, dimensions.width) * 1.25;

  if (!atmosphereEffect || !props.source) return props.children;
  return (
    <DisableGradient>
      <ScopedTheme theme="atmosphere">
        <Image
          source={getImageUri(props.source)}
          blurRadius={5}
          // @ts-expect-error - Brightness prop works.
          style={{
            height: imgSize,
            width: imgSize,
            // Reduce brightness of image so that white text is legible.
            filter: [{ brightness: "80%" }],
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
        {props.children}
      </ScopedTheme>
    </DisableGradient>
  );
}

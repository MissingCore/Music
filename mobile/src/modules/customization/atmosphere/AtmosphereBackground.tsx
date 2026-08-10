// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Image as ExpoImage } from "expo-image";
import { StatusBar, useWindowDimensions } from "react-native";
import { ScopedTheme, withUniwind } from "uniwind";

import { usePreferenceStore } from "~/stores/Preference/store";

import { getImageUri } from "~/lib/file-system";
import type { Maybe } from "~/utils/types";
import { AtmosphereSubtreeContext } from "./store";

const Image = withUniwind(ExpoImage);

export function AtmosphereBackground(props: {
  children: React.ReactNode;
  source: Maybe<string>;
}) {
  const dimensions = useWindowDimensions();
  const atmosphereEffect = usePreferenceStore((s) => s.atmosphereEffect);

  const imgSize = Math.max(dimensions.height, dimensions.width);

  if (!atmosphereEffect || !props.source) return props.children;
  return (
    <AtmosphereSubtreeContext value={true}>
      <StatusBar barStyle="light-content" />
      <ScopedTheme theme="atmosphere">
        <Image
          source={getImageUri(props.source)}
          blurRadius={10}
          // @ts-expect-error - Brightness prop works.
          style={{
            height: imgSize,
            width: imgSize,
            // Reduce brightness of image so that white text is legible.
            filter: [{ brightness: "75%" }],
          }}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 ltr:left-1/2 rtl:right-1/2"
        />
        {props.children}
      </ScopedTheme>
    </AtmosphereSubtreeContext>
  );
}

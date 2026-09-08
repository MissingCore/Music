// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Image as ExpoImage } from "expo-image";
import { useEffect } from "react";
import { StatusBar, useWindowDimensions } from "react-native";
import { ScopedTheme, Uniwind, withUniwind } from "uniwind";

import { usePreferenceStore } from "~/stores/Preference/store";

import { getImageUri } from "~/lib/file-system";
import type { Maybe } from "~/utils/types";
import { AtmosphereSubtreeContext } from "./store";
import {
  deriveAndSetAtmosphereColors,
  getAtmosphereThemeVariables,
} from "./util";

const Image = withUniwind(ExpoImage);

export function AtmosphereBackground(props: {
  children: React.ReactNode;
  source: Maybe<string>;
}) {
  const dimensions = useWindowDimensions();
  const atmosphereEffect = usePreferenceStore((s) => s.atmosphereEffect);

  const imgSize = Math.max(dimensions.height, dimensions.width);

  useEffect(() => {
    const controller = new AbortController();
    deriveAndSetAtmosphereColors(getImageUri(props.source), controller);
    return () => controller.abort();
  }, [props.source]);

  //? Reset the "Atmosphere" Uniwind theme after we no longer show this.
  useEffect(() => {
    return () => {
      Uniwind.updateCSSVariables("atmosphere", getAtmosphereThemeVariables());
    };
  }, []);

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

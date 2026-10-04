// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useFocusEffect } from "@react-navigation/native";
import { Image as ExpoImage } from "expo-image";
import { useCallback } from "react";
import { StatusBar, useWindowDimensions } from "react-native";
import { ScopedTheme, withUniwind } from "uniwind";

import { usePreferenceStore } from "~/stores/Preference/store";

import { getImageUri } from "~/lib/file-system";
import type { MediaImageSrc } from "~/components/next/blocks/media-image";
import { AtmosphereSubtreeContext } from "./store";
import { deriveAndSetAtmosphereColors } from "./util";

const Image = withUniwind(ExpoImage);

export function AtmosphereBackground(props: {
  children: React.ReactNode;
  source: MediaImageSrc;
}) {
  const dimensions = useWindowDimensions();
  const atmosphereEffect = usePreferenceStore((s) => s.atmosphereEffect);

  //? Ensure image isn't our placeholder.
  const _imgSrc = Array.isArray(props.source) ? props.source[0] : props.source;
  const imgSrc = getImageUri(typeof _imgSrc === "string" ? _imgSrc : null);
  const imgSize = Math.max(dimensions.height, dimensions.width);

  useFocusEffect(
    useCallback(() => {
      if (!atmosphereEffect) return;
      const controller = new AbortController();
      deriveAndSetAtmosphereColors(imgSrc, controller);
      return () => controller.abort();
    }, [atmosphereEffect, imgSrc]),
  );

  if (!atmosphereEffect || !imgSrc) return props.children;
  return (
    <AtmosphereSubtreeContext value={true}>
      <StatusBar barStyle="light-content" />
      <ScopedTheme theme="atmosphere">
        <Image
          source={imgSrc}
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

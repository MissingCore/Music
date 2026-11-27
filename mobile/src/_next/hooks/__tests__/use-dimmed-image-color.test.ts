// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { renderHook } from "@testing-library/react-native";
import { createPalette } from "react-native-material-palette";

import { useDimmedImageColor } from "../use-dimmed-image-color";

const BLACK = "#000000";
const BLUE = "#0000FF";

const setPaletteResult = (result: Record<string, any>) => {
  (createPalette as jest.Mock).mockResolvedValue(Promise.resolve(result));
};

describe("useDimmedImageColor", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setPaletteResult({ dominant: { color: BLUE } });
  });

  test("get image dominant color", async () => {
    const { result } = await renderHook(() =>
      useDimmedImageColor("image-with-dominant-color"),
    );

    expect(result.current.toUpperCase()).toEqual(BLUE);
  });

  test("get fallback color if dominant color doesn't exist", async () => {
    setPaletteResult({});

    const { result } = await renderHook(() =>
      useDimmedImageColor("image-without-dominant-color"),
    );

    expect(result.current).toEqual(BLACK);
  });

  test("get fallback color if no image is provided", async () => {
    const { result } = await renderHook(() => useDimmedImageColor(undefined));

    expect(result.current.toUpperCase()).toEqual(BLACK);
  });

  test("get fallback color after the image source is removed", async () => {
    const { result, rerender } = await renderHook(
      ({ src }: { src: unknown }) => useDimmedImageColor(src),
      { initialProps: { src: "image-with-dominant-color" } },
    );

    expect(result.current.toUpperCase()).toEqual(BLUE);
    await rerender({ src: undefined });
    expect(result.current.toUpperCase()).toEqual(BLACK);
  });
});

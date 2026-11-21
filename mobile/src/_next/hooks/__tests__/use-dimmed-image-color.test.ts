// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { renderHook } from "@testing-library/react-native";
import { createPalette } from "react-native-material-palette";

import { useDimmedImageColor } from "../use-dimmed-image-color";

const BLUE = "#0000FF";

jest.mock("@missingcore/native-utils", () => ({
  isSystemDarkMode: true,
}));

jest.mock("react-native-material-palette", () => ({
  createPalette: jest.fn(),
}));

describe("useDimmedImageColor", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (createPalette as jest.Mock).mockResolvedValue({
      dominant: { color: BLUE },
    });
  });

  test("get image dominant color", async () => {
    const { result } = await renderHook(() =>
      useDimmedImageColor("image-with-dominant-color"),
    );

    expect(result.current.toUpperCase()).toEqual(BLUE);
  });

  test("get fallback color if dominant color doesn't exist", async () => {
    (createPalette as jest.Mock).mockResolvedValue({});

    const { result } = await renderHook(() =>
      useDimmedImageColor("image-without-dominant-color"),
    );

    expect(result.current).toEqual("#000000");
  });
});

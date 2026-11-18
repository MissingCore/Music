// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { renderHook } from "@testing-library/react-native";
import { useWindowDimensions } from "react-native";

import { useColumn } from "../use-column";

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const setScreenWidth = (width: number) => {
  jest.mocked(useWindowDimensions).mockReturnValue({
    width,
    height: 800,
    scale: 1,
    fontScale: 1,
  });
};

describe("useColumn", () => {
  beforeEach(() => {
    setScreenWidth(500);
  });

  test("fits the largest number of minimum-width columns with the default gap and gutters", async () => {
    const { result } = await renderHook(() => useColumn(140));

    expect(result.current).toEqual({ count: 3, width: 152 });
  });

  test("includes a column when the available width exactly fits it", async () => {
    setScreenWidth(238);

    const { result } = await renderHook(() =>
      useColumn(100, { gutters: 32, gap: 6 }),
    );

    expect(result.current).toEqual({ count: 2, width: 100 });
  });

  test("honors the minimum column count when the screen is too narrow", async () => {
    setScreenWidth(300);

    const { result } = await renderHook(() =>
      useColumn(180, { minCols: 2, gutters: 40, gap: 10 }),
    );

    expect(result.current).toEqual({ count: 2, width: 125 });
  });
});

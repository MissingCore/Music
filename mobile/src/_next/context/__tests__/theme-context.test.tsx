// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { renderHook } from "@testing-library/react-native";

import { THEMES } from "~/_next/constants/theme";
import { ThemeProvider, useTheme, useColor } from "../theme-context";

const BLUE = "#0000FF";
const PURPLE = "#9D00FF";

jest.mock("@missingcore/native-utils", () => ({
  isSystemDarkMode: true,
}));

describe("useTheme", () => {
  test("returns the default system theme", async () => {
    const { result } = await renderHook(() => useTheme());

    expect(result.current).toEqual(THEMES.system.colors);
  });

  test("applies a partial theme override", async () => {
    const { result } = await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider colors={{ accent: PURPLE }}>{children}</ThemeProvider>
      ),
    });

    expect(result.current).toEqual({ ...THEMES.system.colors, accent: PURPLE });
  });

  test("uses the nearest override and inherits parent colors", async () => {
    const { result } = await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider colors={{ accent: PURPLE, secondary: PURPLE }}>
          <ThemeProvider colors={{ accent: BLUE }}>{children}</ThemeProvider>
        </ThemeProvider>
      ),
    });

    expect(result.current).toEqual({
      ...THEMES.system.colors,
      accent: BLUE,
      secondary: PURPLE,
    });
  });
});

describe("useColor", () => {
  test("returns the default background color", async () => {
    const { result } = await renderHook(() => useColor("background"));

    expect(result.current).toBe(THEMES.system.colors.background);
  });

  test("returns a provided hex color", async () => {
    const { result } = await renderHook(() => useColor(PURPLE));

    expect(result.current).toBe(PURPLE);
  });

  test("uses the provider's color override", async () => {
    const { result } = await renderHook(() => useColor("accent"), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider colors={{ accent: PURPLE }}>{children}</ThemeProvider>
      ),
    });

    expect(result.current).toBe(PURPLE);
  });
});

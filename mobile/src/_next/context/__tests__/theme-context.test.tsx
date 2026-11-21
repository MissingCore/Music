// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { renderHook } from "@testing-library/react-native";

import { THEMES } from "~/_next/constants/theme";
import { withAlpha } from "~/_next/utils/color";
import { ThemeProvider, useTheme, useColor } from "../theme-context";

const BLUE = "#0000FF";
const PURPLE = "#9D00FF";

jest.mock("@missingcore/native-utils", () => ({
  isSystemDarkMode: true,
}));

describe("useTheme", () => {
  test("returns the default system theme", async () => {
    const { result } = await renderHook(() => useTheme());

    expect(result.current).toEqual(THEMES.system);
  });

  test("applies a partial theme override", async () => {
    const { result } = await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider
          scheme="light"
          colors={{ accent: PURPLE }}
          fonts={{ accent: "NDot" }}
        >
          {children}
        </ThemeProvider>
      ),
    });

    expect(result.current).toEqual({
      scheme: "light",
      colors: { ...THEMES.system.colors, accent: PURPLE },
      fonts: { ...THEMES.system.fonts, accent: "NDot" },
    });
  });

  test("uses the nearest override and inherits parent colors", async () => {
    const { result } = await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider
          scheme="dark"
          colors={{ accent: PURPLE, secondary: PURPLE }}
          fonts={{ accent: "Geist Mono", primary: "System" }}
        >
          <ThemeProvider
            scheme="light"
            colors={{ accent: BLUE }}
            fonts={{ accent: "NDot" }}
          >
            {children}
          </ThemeProvider>
        </ThemeProvider>
      ),
    });

    expect(result.current).toEqual({
      scheme: "light",
      colors: { ...THEMES.system.colors, accent: BLUE, secondary: PURPLE },
      fonts: { accent: "NDot", primary: "System" },
    });
  });

  test("derived colors are re-calculated if base color changes", async () => {
    const { result } = await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider colors={{ text: BLUE }}>{children}</ThemeProvider>
      ),
    });

    expect(result.current).toEqual({
      ...THEMES.system,
      colors: {
        ...THEMES.system.colors,
        text: BLUE,
        textMuted: withAlpha(BLUE, 0.75),
        border: withAlpha(BLUE, 0.25),
      },
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

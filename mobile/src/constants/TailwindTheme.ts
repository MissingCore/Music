import * as Styles from "./Styles";

/** Theme used in Tailwind configuration. */
export const TailwindTheme = {
  borderRadius: pixelfyUnit(Styles.BorderRadius),
  colors: {
    ...Styles.Colors,
    canvas: "rgb(var(--color-canvas) / <alpha-value>)",
    canvasAlt: "rgb(var(--color-canvasAlt) / <alpha-value>)",
    surface: "rgb(var(--color-surface) / <alpha-value>)",
    onSurface: "rgb(var(--color-onSurface) / <alpha-value>)",
    foreground: "rgb(var(--color-foreground) / <alpha-value>)",
  } as const,
  fontFamily: Styles.FontFamily,
  fontSize: pixelfyUnit(Styles.FontSize),
} as const;

/** Append `px` to the end of the number. */
function pixelfyUnit<T extends Record<string, number>>(
  theme: T,
): { [TKey in keyof T]: `${T[TKey]}px` } {
  const pixelfiedTheme: Record<string, string> = {};
  Object.keys(theme).forEach((key) => {
    pixelfiedTheme[key] = `${theme[key]}px`;
  });
  return pixelfiedTheme as { [TKey in keyof T]: `${T[TKey]}px` };
}

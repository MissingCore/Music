import { z } from "zod/mini";

import { ZSchema } from "~/modules/form/utils";
import type { ThemeRole } from "../constants";
import { ThemeRoleOptions } from "../constants";
import { normalizeHexColor } from "../helpers/color";

export const HexColorSchema = z.pipe(
  ZSchema.NonEmptyString,
  z.transform((str, ctx) => {
    const normalized = normalizeHexColor(str);
    if (normalized) return normalized;

    ctx.issues.push({
      code: "invalid_value",
      input: str,
      values: [str],
      message: "Expected a valid hex color.",
    });
    return z.NEVER;
  }),
);

const ColorRolesSchema = Object.fromEntries(
  ThemeRoleOptions.map((role) => [role, HexColorSchema]),
) as Record<ThemeRole, typeof HexColorSchema>;

//#region Form Schema
export const ThemeEntrySchema = z.object({
  // Additional context:
  _id: z.nullable(z.string()),
  _importGen: z.nullable(z.number()),
  // Actual form fields:
  name: ZSchema.NonEmptyString,
  scheme: z.enum(["light", "dark"]),
  ...ColorRolesSchema,
});

export type ThemeEntry = z.infer<typeof ThemeEntrySchema>;
//#endregion

//#region Backup Schema
export const ThemeExportSchema = z.object({
  name: ZSchema.NonEmptyString,
  scheme: z.enum(["light", "dark"]),
  colors: z.object(ColorRolesSchema),
});

export type ThemeExport = z.infer<typeof ThemeExportSchema>;
//#endregion

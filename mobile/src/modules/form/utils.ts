// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { z } from "zod/mini";

/** Reusable pre-defined Zod Mini schemas. */
export const ZSchema = {
  NonEmptyString: z.string().check(z.trim(), z.minLength(1)),
  NullableString: z.nullable(
    z.pipe(
      z.string().check(z.trim()), // String will get trimmed.
      z.transform((str) => (str === "" ? null : str)),
    ),
  ),
  NullableRealNumber: z.nullable(z.number().check(z.int(), z.gt(0))),
};

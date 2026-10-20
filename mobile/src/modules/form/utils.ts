// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import * as v from "valibot";

/** Reusable pre-defined Valibot schemas. */
export const FormSchema = {
  NonEmptyString: v.pipe(v.string(), v.trim(), v.minLength(1)),
  NullableString: v.nullable(
    v.pipe(
      v.string(),
      v.trim(),
      v.transform((str) => (str === "" ? null : str)),
    ),
  ),
  RealNumber: v.pipe(v.number(), v.integer(), v.gtValue(0)),
  NullableRealNumber: v.nullable(v.pipe(v.number(), v.integer(), v.gtValue(0))),
};

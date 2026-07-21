// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { clamp } from "~/utils/number";

export const GridColumnSizeConfig = {
  bound: { min: 50, max: 200 },
  clamp(value: number) {
    return clamp(this.bound.min, value, this.bound.max);
  },
};

export const ListColumnSizeConfig = {
  bound: { min: 100, max: 400 },
  clamp(value: number) {
    return clamp(this.bound.min, value, this.bound.max);
  },
};

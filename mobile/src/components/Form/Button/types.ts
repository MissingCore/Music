// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { PressableProps } from "../../Base/Pressable";

/** The most "used" action props used on `<Pressable />`. */
export type PressProps = Pick<
  PressableProps,
  | "disabled"
  | "delayLongPress"
  | "onLongPress"
  | "onPress"
  | "onPressIn"
  | "onPressOut"
>;

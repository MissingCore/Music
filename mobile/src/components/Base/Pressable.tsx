// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { PressableProps as RNPressableProps } from "react-native";
import { Pressable as RNPresasble } from "react-native";

export type PressableProps = RNPressableProps;
export const Pressable = RNPresasble;

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

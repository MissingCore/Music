// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { PressableProps as RNPressableProps } from "react-native";
import { Pressable as RNPressable } from "react-native";

export type PressableProps = RNPressableProps;
export const Pressable = RNPressable;

/** Excerpt of `Pressable` props that we'll support on custom components. */
export type PressProps = Pick<PressableProps, "onPress" | "disabled">;

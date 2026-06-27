// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { GestureHandlerRootView as RawGestureHandlerRootView } from "react-native-gesture-handler";
import { withUniwind } from "uniwind";

export const GestureHandlerRootView = withUniwind(RawGestureHandlerRootView);

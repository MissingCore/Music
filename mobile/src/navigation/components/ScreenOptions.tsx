// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import type { ParseKeys } from "i18next";
import { useLayoutEffect } from "react";

type SupportedScreenOptions = {
  headerLeft?: () => React.ReactNode;
  headerRight?: () => React.ReactNode;
  title?: ParseKeys;
};

export function ScreenOptions(options: SupportedScreenOptions) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions(options);
  }, [navigation, options]);

  return null;
}

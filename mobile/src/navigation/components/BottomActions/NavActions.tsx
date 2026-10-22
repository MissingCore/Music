// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";

import { useHasNewUpdate } from "~/navigation/hooks/useHasNewUpdate";

import { OnRTL } from "~/lib/react";
import { FilledIconButton } from "~/components/Form/Button/Icon";

export function SearchButton() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <Animated.View
      entering={OnRTL.decide(SlideInRight, SlideInLeft)}
      exiting={OnRTL.decide(SlideOutRight, SlideOutLeft)}
    >
      <FilledIconButton
        icon="search"
        accessibilityLabel={t("feat.search.title")}
        onPress={() => navigation.navigate("Search")}
        size="lg"
        className="size-14"
      />
    </Animated.View>
  );
}

export function SettingsButton() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();
  return (
    <Animated.View
      entering={OnRTL.decide(SlideInLeft, SlideInRight)}
      exiting={OnRTL.decide(SlideOutLeft, SlideOutRight)}
      className="relative"
    >
      <FilledIconButton
        icon="settings"
        accessibilityLabel={t("term.settings")}
        onPress={() => navigation.navigate("Settings")}
        size="lg"
        className="size-14"
      />
      {hasNewUpdate && (
        <View className="absolute top-3 right-3 size-2 rounded-full bg-primary" />
      )}
    </Animated.View>
  );
}

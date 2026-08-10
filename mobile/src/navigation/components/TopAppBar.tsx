// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { getHeaderTitle } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { FilledIconButton } from "~/components/Form/Button/Icon";
import { TEm } from "~/components/Typography/StyledText";

export const TOPAPPBAR_HEIGHT = 56;

/** Custom header bar for React Navigation. The "title" will get ellipsized. */
export function TopAppBar({ options, route }: NativeStackHeaderProps) {
  const title = getHeaderTitle(options, route.name) as ParseKeys;
  return (
    <View className="pt-safe">
      <TopAppBarTemplate
        title={title}
        headerLeftAction={<BackButton disabled={!!options.headerLeft} />}
        headerRightAction={options.headerRight?.({ canGoBack: true })}
      />
    </View>
  );
}

/** `<TopAppBar />` component without the safe-area handling. */
export function TopAppBarTemplate({
  title,
  headerLeftAction,
  headerRightAction,
}: {
  title?: ParseKeys;
  headerLeftAction?: React.ReactNode;
  headerRightAction?: React.ReactNode;
}) {
  return (
    <View className="h-14 flex-row items-center justify-between gap-4 px-2 py-1">
      {headerLeftAction || <HeaderActionPlaceholder />}
      {title ? (
        <TEm textKey={title} numberOfLines={1} className="shrink text-base" />
      ) : null}
      {headerRightAction || <HeaderActionPlaceholder />}
    </View>
  );
}

export function BackButton({ disabled = false }) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <FilledIconButton
      icon="arrow-back"
      accessibilityLabel={t("form.back")}
      onPress={() => navigation.goBack()}
      disabled={disabled}
      className="rtl:rotate-180"
    />
  );
}

function HeaderActionPlaceholder() {
  return <View pointerEvents="none" className="size-10" />;
}

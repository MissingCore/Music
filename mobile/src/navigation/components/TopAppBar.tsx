// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { FilledIconButton } from "~/components/Form/Button/Icon";
import { TEm } from "~/components/Typography/StyledText";

/**
 * `<TopAppBar />` component without the safe-area handling.
 *
 * @description - We want to switch over to our toolbar UI.
 */
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

/** @deprecated - We want to switch over to our toolbar UI. */
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

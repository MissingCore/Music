// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { getHeaderTitle } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { FilledIconButton } from "~/components/Form/Button/Icon";
import { SafeContainer } from "~/components/SafeContainer";
import { TEm } from "~/components/Typography/StyledText";

/** Custom header bar for React Navigation. The "title" will get ellipsized. */
export function TopAppBar({ options, route }: NativeStackHeaderProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const title = getHeaderTitle(options, route.name) as ParseKeys;

  return (
    <SafeContainer>
      <TopAppBarTemplate
        title={title}
        headerLeftAction={
          <FilledIconButton
            icon="arrow-back"
            accessibilityLabel={t("form.back")}
            onPress={() => navigation.goBack()}
            disabled={!!options.headerLeft}
            className="rtl:rotate-180"
          />
        }
        headerRightAction={options.headerRight?.({ canGoBack: true })}
      />
    </SafeContainer>
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

function HeaderActionPlaceholder() {
  return <View pointerEvents="none" className="size-10" />;
}

import { getHeaderTitle } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ArrowBack } from "~/resources/icons/ArrowBack";

import { OnRTL } from "~/lib/react";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { SafeContainer } from "~/components/SafeContainer";
import { StyledText } from "~/components/Typography/StyledText";

/** Custom header bar for React Navigation. The "title" will get ellipsized. */
export function TopAppBar({ options, route }: NativeStackHeaderProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const title = getHeaderTitle(options, route.name) as ParseKeys;

  return (
    <SafeContainer className="bg-surface">
      <View className="h-14 flex-row items-center justify-between gap-4 px-2 py-1">
        <FilledIconButton
          Icon={ArrowBack}
          accessibilityLabel={t("form.back")}
          onPress={() => navigation.goBack()}
          disabled={!!options.headerLeft}
          className={OnRTL._use("rotate-180")}
          size="sm"
        />

        <StyledText numberOfLines={1} bold className="shrink">
          {t(title)}
        </StyledText>

        {options.headerRight ? (
          options.headerRight({ canGoBack: true })
        ) : (
          <View className="size-10" />
        )}
      </View>
    </SafeContainer>
  );
}

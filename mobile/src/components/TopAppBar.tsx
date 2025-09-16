import { getHeaderTitle } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ArrowBack } from "~/resources/icons/ArrowBack";

import { OnRTL } from "~/lib/react";
import { SafeContainer } from "./Containment/SafeContainer";
import { IconButton } from "./Form/Button";
import { StyledText } from "./Typography/StyledText";

/**
 * Custom header bar for React Navigation. The "title" can span at most
 * 2 lines before it gets ellipsized.
 */
export function TopAppBar({ options, route }: NativeStackHeaderProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const title = getHeaderTitle(options, route.name);

  return (
    <SafeContainer className="bg-canvas">
      <View className="h-14 flex-row items-center justify-between gap-4 p-1">
        <IconButton
          Icon={ArrowBack}
          accessibilityLabel={t("form.back")}
          onPress={() => navigation.goBack()}
          disabled={!!options.headerLeft}
          className={OnRTL._use("rotate-180")}
        />

        <StyledText numberOfLines={2} className="shrink text-center text-xs">
          {title.toLocaleUpperCase()}
        </StyledText>

        {options.headerRight ? (
          options.headerRight({ canGoBack: true })
        ) : (
          <View className="size-12" />
        )}
      </View>
    </SafeContainer>
  );
}

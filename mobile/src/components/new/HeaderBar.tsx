import { getHeaderTitle } from "@react-navigation/elements";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { ArrowBack } from "@/resources/icons/ArrowBack";

import { Marquee } from "./Marquee";
import { SafeContainer } from "./SafeContainer";
import { StyledPressable } from "./StyledPressable";

/**
 * Custom header bar for React Navigation. The "title" can span at most
 * 2 lines before it gets ellipsized.
 */
export function HeaderBar({ options, route }: NativeStackHeaderProps) {
  const { t } = useTranslation();
  const title = getHeaderTitle(options, route.name);

  return (
    <SafeContainer className="bg-canvas">
      <View className="h-14 flex-row items-center justify-between gap-4 p-1">
        <StyledPressable
          accessibilityLabel={t("form.back")}
          onPress={() => router.back()}
          forIcon
        >
          <View pointerEvents="none">
            <ArrowBack />
          </View>
        </StyledPressable>

        <Text
          numberOfLines={2}
          className="shrink font-roboto text-xs text-foreground"
        >
          {title.toLocaleUpperCase()}
        </Text>

        {options.headerRight ? (
          options.headerRight({ canGoBack: true })
        ) : (
          <View className="size-12" />
        )}
      </View>
    </SafeContainer>
  );
}

/**
 * Custom header bar for React Navigation. The "title" will span across
 * a single line through a `<Marquee />`.
 */
export function HeaderBarMarquee({ options, route }: NativeStackHeaderProps) {
  const { t } = useTranslation();
  const title = getHeaderTitle(options, route.name);

  return (
    <SafeContainer className="bg-canvas">
      <View className="h-14 flex-row items-center justify-between gap-4 p-1">
        <StyledPressable
          accessibilityLabel={t("form.back")}
          onPress={() => router.back()}
          forIcon
        >
          <View pointerEvents="none">
            <ArrowBack />
          </View>
        </StyledPressable>

        <Marquee>
          <Text className="font-roboto text-xs text-foreground">{title}</Text>
        </Marquee>

        {options.headerRight ? (
          options.headerRight({ canGoBack: true })
        ) : (
          <View className="size-12" />
        )}
      </View>
    </SafeContainer>
  );
}

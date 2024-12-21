import { getHeaderTitle } from "@react-navigation/elements";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ArrowBack } from "@/icons";
import { useTheme } from "@/hooks/useTheme";

import { Marquee, SafeContainer } from "./Containment";
import { IconButton } from "./Form";
import { StyledText } from "./Typography";

//#region Normal
/**
 * Custom header bar for React Navigation. The "title" can span at most
 * 2 lines before it gets ellipsized.
 */
export function TopAppBar({ options, route }: NativeStackHeaderProps) {
  const { t } = useTranslation();
  const title = getHeaderTitle(options, route.name);

  return (
    <SafeContainer className="bg-canvas">
      <View className="h-14 flex-row items-center justify-between gap-4 p-1">
        <IconButton
          kind="ripple"
          accessibilityLabel={t("form.back")}
          disabled={!!options.headerLeft}
          onPress={() => router.back()}
        >
          <ArrowBack />
        </IconButton>

        <StyledText numberOfLines={2} className="shrink text-xs">
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
//#endregion

//#region With Marquee
/**
 * Custom header bar for React Navigation. The "title" will span across
 * a single line through a `<Marquee />`.
 */
export function TopAppBarMarquee({ options, route }: NativeStackHeaderProps) {
  const { t } = useTranslation();
  const { canvas } = useTheme();
  const title = getHeaderTitle(options, route.name);

  return (
    <SafeContainer className="bg-canvas">
      <View className="h-14 flex-row items-center justify-between gap-4 p-1">
        <IconButton
          kind="ripple"
          accessibilityLabel={t("form.back")}
          disabled={!!options.headerLeft}
          onPress={() => router.back()}
        >
          <ArrowBack />
        </IconButton>

        <Marquee color={canvas} center wrapperClassName="shrink">
          <StyledText className="text-xs">{title}</StyledText>
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
//#endregion

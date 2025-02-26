import { getHeaderTitle } from "@react-navigation/elements";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ArrowBack } from "~/icons/ArrowBack";
import { useTheme } from "~/hooks/useTheme";

import { Marquee } from "./Containment/Marquee";
import { SafeContainer } from "./Containment/SafeContainer";
import { IconButton } from "./Form/Button";
import { StyledText } from "./Typography/StyledText";

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
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { canvas, theme } = useTheme();
  const title = getHeaderTitle(options, route.name);

  return (
    <SafeContainer className="relative">
      <LinearGradient
        colors={[`${canvas}${theme === "light" ? "B3" : "00"}`, `${canvas}FF`]}
        start={{ x: 0.0, y: 1.0 }}
        end={{ x: 0.0, y: 0.0 }}
        style={{ height: insets.top + 56 }}
        className="absolute left-0 top-0 w-full"
      />
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

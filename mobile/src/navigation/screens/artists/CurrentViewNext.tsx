// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { LinearGradientProps } from "expo-linear-gradient";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import { easeGradient } from "react-native-easing-gradient";

import { useArtistDetails } from "~/data/artist/queries";

import { OnRTL } from "~/lib/react";
import type { ExtractQueryData } from "~/lib/react-query";
import { Seconds } from "~/utils/date";
import { isString } from "~/utils/validation";
import { BlurIconButton } from "~/components/next/base/blur-button-icon";
import { Icon } from "~/components/next/base/icon";
import { Ripple } from "~/components/next/base/ripple";
import { Text, TText } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";
import { Image } from "~/components/next/primitive/image";
import type { HexColor } from "~/modules/customization/theme/core/constants";
import { useTintedDominantColor } from "~/modules/customization/theme/hooks";

type ArtistDetail = ExtractQueryData<typeof useArtistDetails>;

type Props = StaticScreenProps<{ id: string }>;

export default function Artist({
  route: {
    params: { id: artistName },
  },
}: Props) {
  const { isPending, error, data } = useArtistDetails(artistName);
  const mainColor = useTintedDominantColor(data?.imageSource);

  if (isPending || error) return null;
  return (
    <View style={{ backgroundColor: mainColor }} className="grow">
      <TopAppBar />
      <ScreenHeader {...data} mainColor={mainColor} />
    </View>
  );
}

function TopAppBar() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 top-0 z-50 flex-row items-center justify-between p-2 pt-safe-offset-2"
    >
      <BlurIconButton
        icon={OnRTL.decide("east", "west")}
        accessibilityLabel={t("form.back")}
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

function ScreenHeader(
  props: Pick<
    ArtistDetail,
    "name" | "imageSource" | "numTracks" | "totalDuration"
  > & { mainColor: HexColor },
) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const headerHeight = Math.min(400, width, height);

  const { colors, locations } = useMemo(
    () =>
      easeGradient({
        colorStops: {
          0: { color: `${props.mainColor}00` },
          1: { color: props.mainColor },
        },
      }) as unknown as Pick<LinearGradientProps, "colors" | "locations">,
    [props.mainColor],
  );

  return (
    <View
      style={{ height: headerHeight }}
      className="relative w-full items-center justify-end"
    >
      <Image
        source={isString(props.imageSource) ? props.imageSource : null}
        contentFit="cover"
        contentPosition="top"
        className="absolute inset-0 size-full"
      />
      <LinearGradient
        colors={colors}
        locations={locations}
        style={{ height: headerHeight * 0.6 }}
        className="absolute inset-x-0 bottom-0 w-full"
      />

      <View className="w-full p-4">
        <Marquee center>
          <Text bold size="4xl" className="text-white">
            {props.name}
          </Text>
        </Marquee>
        <Marquee
          center
          contentContainerClassName="mt-2 mb-4 flex-row items-center"
        >
          <Text size="sm" className="text-white/80">
            {t("plural.track", { count: props.numTracks })}
          </Text>
          {/* Work around for RTL languages. */}
          <Text size="sm" className="text-white/80">
            {" • "}
          </Text>
          <Icon name="schedule" size={16} color="#FFFFFFCC" />
          <Text size="sm" className="text-white/80">
            {` ${Seconds.toReadableTime(props.totalDuration, true)}`}
          </Text>
        </Marquee>
        <Ripple
          onPress={() => console.log("Playing from artist list...")}
          rippleColor="#C8C8C8"
          className="min-h-12 min-w-32 flex-row items-center justify-center gap-1 self-center rounded-full bg-white p-2"
        >
          <Icon name="play-arrow-filled" size={32} color={props.mainColor} />
          <TText
            textKey="term.play"
            bold
            size="lg"
            style={{ color: props.mainColor }}
          />
        </Ripple>
      </View>
    </View>
  );
}

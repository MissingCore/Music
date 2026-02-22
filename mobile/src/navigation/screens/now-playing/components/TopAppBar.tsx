import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ArrowBack } from "~/resources/icons/ArrowBack";
import { usePlaybackStore } from "~/stores/Playback/store";
import { usePreferenceStore } from "~/stores/Preference/store";

import { getMediaLinkContext } from "~/navigation/utils/router";

import { OnRTL } from "~/lib/react";
import { Pressable } from "~/components/Base/Pressable";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { Marquee } from "~/components/Marquee";
import { SafeContainer } from "~/components/SafeContainer";
import { StyledText } from "~/components/Typography/StyledText";

/**
 * Header bar design for "Now Playing" screen which automatically displays
 * the list being played without setting the `title` prop.
 */
export function NowPlayingTopAppBar() {
  return (
    <SafeContainer>
      <View className="h-14 flex-row items-center justify-between gap-4 px-2 py-1">
        <AppBarContent />
      </View>
    </SafeContainer>
  );
}

/** Conditionally render the header content depending on the design used. */
function AppBarContent() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const playingSource = usePlaybackStore((s) => s.playingFrom);
  const listName = usePlaybackStore((s) => s.playingFromName);
  const usedDesign = usePreferenceStore((s) => s.nowPlayingDesign);

  const listLinkInfo = useMemo(
    () => (playingSource ? getMediaLinkContext(playingSource) : undefined),
    [playingSource],
  );

  if (usedDesign === "vinylOld") return null;
  return (
    <>
      <FilledIconButton
        Icon={ArrowBack}
        accessibilityLabel={t("form.back")}
        onPress={() => navigation.goBack()}
        className={OnRTL._use("rotate-180")}
      />
      <Pressable
        onPress={() =>
          listLinkInfo ? navigation.popTo(...listLinkInfo) : undefined
        }
        disabled={listLinkInfo === undefined}
        className="shrink gap-0.5"
      >
        <Marquee center>
          <StyledText dim className="text-xxs/[1.125]">
            {t("term.playingFrom")}
          </StyledText>
        </Marquee>
        <Marquee center>
          <StyledText className="text-xs/[1.125]">{listName}</StyledText>
        </Marquee>
      </Pressable>
      <View className="size-10" />
    </>
  );
}

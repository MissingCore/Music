import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ArrowBack } from "~/resources/icons/ArrowBack";
import { usePlaybackStore } from "~/stores/Playback/store";
import { useUserPreferencesStore } from "~/services/UserPreferences";
import { getMediaLinkContext } from "../../../utils/router";

import { OnRTL } from "~/lib/react";
import { Marquee } from "~/components/Containment/Marquee";
import { SafeContainer } from "~/components/Containment/SafeContainer";
import { IconButton } from "~/components/Form/Button";
import { StyledText } from "~/components/Typography/StyledText";

/**
 * Header bar design for "Now Playing" screen which automatically displays
 * the list being played without setting the `title` prop.
 */
export function NowPlayingTopAppBar() {
  return (
    <SafeContainer className="relative">
      <View className="h-14 flex-row items-center justify-between gap-4 p-1">
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
  const usedDesign = useUserPreferencesStore((state) => state.nowPlayingDesign);

  const listLinkInfo = useMemo(
    () => (playingSource ? getMediaLinkContext(playingSource) : undefined),
    [playingSource],
  );

  if (usedDesign === "vinylOld") return null;

  return (
    <>
      <IconButton
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
          <StyledText className="text-xxs/[1.125]" dim>
            {t("term.playingFrom")}
          </StyledText>
        </Marquee>
        <Marquee center>
          <StyledText className="text-xs/[1.125]">{listName}</StyledText>
        </Marquee>
      </Pressable>
      <View className="size-12" />
    </>
  );
}

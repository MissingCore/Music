import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ArrowBack } from "~/resources/icons/ArrowBack";
import { useUserPreferencesStore } from "~/services/UserPreferences";
import { useMusicStore } from "~/modules/media/services/Music";
import { router } from "~/navigation/utils/router";

import { OnRTL } from "~/lib/react";
import { Marquee } from "~/components/Containment/Marquee";
import { SafeContainer } from "~/components/Containment/SafeContainer";
import { IconButton } from "~/components/Form/Button";
import { StyledText } from "~/components/Typography/StyledText";
import { getSourceLink } from "~/modules/media/helpers/data";

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
  const playingSource = useMusicStore((state) => state.playingSource);
  const listName = useMusicStore((state) => state.sourceName);
  const usedDesign = useUserPreferencesStore((state) => state.nowPlayingDesign);

  const listHref = useMemo(() => getSourceLink(playingSource), [playingSource]);

  if (usedDesign === "vinylOld") return null;

  return (
    <>
      <IconButton
        Icon={ArrowBack}
        accessibilityLabel={t("form.back")}
        onPress={() => router.back()}
        className={OnRTL._use("rotate-180")}
      />
      <Pressable
        onPress={() => (listHref ? router.navigate(listHref) : undefined)}
        disabled={listHref === undefined}
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

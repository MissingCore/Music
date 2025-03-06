import type { Href } from "expo-router";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ArrowBack } from "~/icons/ArrowBack";
import { useUserPreferencesStore } from "~/services/UserPreferences";
import { useMusicStore } from "~/modules/media/services/Music";
import { useTheme } from "~/hooks/useTheme";

import { Marquee } from "~/components/Containment/Marquee";
import { SafeContainer } from "~/components/Containment/SafeContainer";
import { IconButton } from "~/components/Form/Button";
import { StyledText } from "~/components/Typography/StyledText";
import { ReservedPlaylists } from "~/modules/media/constants";

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
  const { canvas } = useTheme();
  const playingSource = useMusicStore((state) => state.playingSource);
  const listName = useMusicStore((state) => state.sourceName);
  const usedDesign = useUserPreferencesStore((state) => state.nowPlayingDesign);

  const listHref = useMemo(() => {
    if (!playingSource || playingSource.type === "folder") return undefined;
    const { type, id } = playingSource;
    if (type === "playlist" && id === ReservedPlaylists.tracks) return "/track";
    return `/${type}/${encodeURIComponent(id)}` satisfies Href;
  }, [playingSource]);

  if (usedDesign === "vinylOld") return null;

  return (
    <>
      <IconButton
        kind="ripple"
        accessibilityLabel={t("form.back")}
        onPress={() => router.back()}
      >
        <ArrowBack />
      </IconButton>
      <Pressable
        onPress={() => (listHref ? router.navigate(listHref) : undefined)}
        disabled={listHref === undefined}
        className="shrink gap-0.5"
      >
        <Marquee color={canvas} center wrapperClassName="shrink">
          <StyledText className="text-xxs/[1.125]" dim>
            {t("term.playingFrom")}
          </StyledText>
        </Marquee>
        <Marquee color={canvas} center wrapperClassName="shrink">
          <StyledText className="text-xs/[1.125]">{listName}</StyledText>
        </Marquee>
      </Pressable>
      <View className="size-12" />
    </>
  );
}

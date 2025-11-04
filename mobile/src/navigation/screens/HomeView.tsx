import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { History } from "~/resources/icons/History";
import {
  useFavoriteListsForCards,
  useFavoriteTracksCount,
} from "~/queries/favorite";
import { StandardScrollLayout } from "../layouts/StandardScroll";

import { cn } from "~/lib/style";
import { abbreviateNum } from "~/utils/number";
import { FlashList } from "~/components/Defaults";
import { Button, IconButton } from "~/components/Form/Button";
import { AccentText } from "~/components/Typography/AccentText";
import { TEm, TStyledText } from "~/components/Typography/StyledText";
import {
  MediaCardPlaceholderContent,
  useMediaCardListPreset,
} from "~/modules/media/components/MediaCard";

export default function Home() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <StandardScrollLayout
      titleKey="term.home"
      titleAction={
        <IconButton
          Icon={History}
          accessibilityLabel={t("feat.playedRecent.title")}
          onPress={() => navigation.navigate("RecentlyPlayed")}
          large
        />
      }
      showScrollbar
      showStatusBarShadow
    >
      <TEm textKey="term.favorites" className="-mb-4" />
      <Favorites />
    </StandardScrollLayout>
  );
}

//#region Favorites
/** Display list of content we've favorited. */
function Favorites() {
  const { data } = useFavoriteListsForCards();
  const presets = useMediaCardListPreset({
    data: [MediaCardPlaceholderContent, ...(data ?? [])],
    RenderFirst: FavoriteTracks,
  });

  return <FlashList {...presets} />;
}

/**
 * Displays the number of favorited tracks and opens up the playlist of
 * favorited tracks.
 */
function FavoriteTracks(props: { size: number; className: string }) {
  const navigation = useNavigation();
  const { isPending, error, data } = useFavoriteTracksCount();

  const trackCount = isPending || error ? "" : abbreviateNum(data);

  return (
    <Button
      onPress={() => navigation.navigate("FavoriteTracks")}
      style={{ width: props.size, height: props.size }}
      className={cn("gap-0 rounded-lg bg-red", props.className)}
    >
      <AccentText className="text-[3rem] text-neutral100">
        {trackCount}
      </AccentText>
      <TStyledText textKey="term.tracks" className="text-neutral100" />
    </Button>
  );
}
//#endregion

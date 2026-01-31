import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { History } from "~/resources/icons/History";
import { useFavoriteListsForCards } from "~/queries/favorite";

import { HomeScrollListLayout } from "../layouts/HomeScrollListLayout";

import { LegendList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button/Icon";
import { TEm } from "~/components/Typography/StyledText";
import { useMediaCardListPreset } from "~/modules/media/components/MediaCard";

export default function Home() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <HomeScrollListLayout
      titleKey="term.home"
      titleAction={
        <IconButton
          Icon={History}
          accessibilityLabel={t("feat.playedRecent.title")}
          onPress={() => navigation.navigate("RecentlyPlayed")}
          size="lg"
        />
      }
    >
      <TEm textKey="term.favorites" className="-mb-4" />
      <Favorites />
    </HomeScrollListLayout>
  );
}

//#region Favorites
/** Display list of content we've favorited. */
function Favorites() {
  const { data } = useFavoriteListsForCards();
  const presets = useMediaCardListPreset({ data });
  return <LegendList {...presets} />;
}
//#endregion

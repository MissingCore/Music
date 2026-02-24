import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { History } from "~/resources/icons/History";
import { useFavoriteListsForCards } from "~/data/favorite/queries";

import { NScrollLayout } from "~/navigation/layouts/NScrollLayout";

import { LegendList } from "~/components/Base/LegendList";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { TEm } from "~/components/Typography/StyledText";
import { useMediaCardListPreset } from "~/modules/media/components/MediaCard";

export default function Home() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <NScrollLayout
      titleKey="term.home"
      Actions={
        <FilledIconButton
          Icon={History}
          accessibilityLabel={t("feat.playedRecent.title")}
          onPress={() => navigation.navigate("RecentlyPlayed")}
        />
      }
    >
      <TEm textKey="term.favorites" className="-mb-4" />
      <Favorites />
    </NScrollLayout>
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

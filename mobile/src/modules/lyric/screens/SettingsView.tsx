import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Icon } from "~/resources/icons";
import { useLyricStore } from "../core/store";
import { toggleCheckEmbeddedLyrics } from "../core/actions";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { SegmentedList } from "~/components/List/Segmented";
import { Switch } from "~/components/UI/Switch";

export default function LyricsSettings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const checkEmbeddedLyrics = useLyricStore((s) => s.checkEmbedded);

  return (
    <ListLayout>
      <SegmentedList>
        <SegmentedList.Item
          labelTextKey="feat.lyrics.extra.providers"
          onPress={() => navigation.navigate("LyricsProviders")}
          LeftElement={<Icon name="search" />}
          className="gap-4"
        />
        <SegmentedList.Item
          labelText={t("template.entryManage", {
            name: t("feat.lyrics.title"),
          })}
          onPress={() => navigation.navigate("Lyrics", {})}
          LeftElement={<Icon name="lyrics" />}
          className="gap-4"
        />
      </SegmentedList>

      <SegmentedList.Item
        labelTextKey="feat.lyrics.extra.useEmbedded"
        onPress={toggleCheckEmbeddedLyrics}
        RightElement={<Switch enabled={checkEmbeddedLyrics} />}
      />
    </ListLayout>
  );
}

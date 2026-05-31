import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Add } from "~/resources/icons/Add";
import { Edit } from "~/resources/icons/Edit";
import { useLyricStore } from "../core/store";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { LegendList } from "~/components/Base/LegendList";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { ListItem } from "~/components/List";

export default function LyricsProviders() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const lyricProviders = useLyricStore((s) => s.providers);

  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <FilledIconButton
            Icon={Add}
            accessibilityLabel={t("form.create")}
            onPress={() => navigation.navigate("CreateLyricProvider")}
          />
        )}
      />
      <LegendList
        data={lyricProviders}
        keyExtractor={({ id }) => id}
        renderItem={({ item }) => (
          <ListItem
            labelText={item.name}
            supportingText={item.endpoint}
            RightElement={<Edit />}
            onPress={() =>
              console.log(`Editing "${item.name}" lyric provider...`)
            }
            className="mb-0.75"
          />
        )}
        ListEmptyComponent={
          <ContentPlaceholder errMsgKey="err.msg.noContent" />
        }
        contentContainerClassName="p-4"
      />
    </>
  );
}

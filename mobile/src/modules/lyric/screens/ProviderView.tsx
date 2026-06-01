import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Add } from "~/resources/icons/Add";
import { Edit } from "~/resources/icons/Edit";
import { Info } from "~/resources/icons/Info";
import { OpenInNew } from "~/resources/icons/OpenInNew";
import { useLyricStore } from "../core/store";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { Links, openLink } from "~/lib/web-browser";
import { LegendList } from "~/components/Base/LegendList";
import { Button } from "~/components/Form/Button";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { ListItem } from "~/components/List";
import { StyledText } from "~/components/Typography/StyledText";

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
            RightElement={
              <IconButton
                Icon={Edit}
                accessibilityLabel={t("form.edit")}
                onPress={() =>
                  navigation.navigate("ModifyLyricProvider", { id: item.id })
                }
              />
            }
            className="mb-4"
          />
        )}
        ListHeaderComponent={<Instructions />}
        ListEmptyComponent={
          <ContentPlaceholder errMsgKey="err.msg.noContent" />
        }
        className="-mb-4"
        contentContainerClassName="p-4"
      />
    </>
  );
}

function Instructions() {
  const { t } = useTranslation();
  return (
    <Button
      onPress={() => openLink(Links.LyricsProviders)}
      className="mb-4 flex-row items-start pl-2"
    >
      <Info size={20} color="onSurfaceVariant" />
      <StyledText dim className="shrink grow text-sm">
        {t("feat.lyrics.extra.providersInstructions.line1")}
        {"\n\n"}
        {t("feat.lyrics.extra.providersInstructions.line2")}
      </StyledText>
      <OpenInNew />
    </Button>
  );
}

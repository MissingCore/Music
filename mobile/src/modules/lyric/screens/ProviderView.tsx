import type { DragListRenderItemInfo } from "@missingcore/ui/drag-list";
import { DragList, useDragListState } from "@missingcore/ui/drag-list";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Add } from "~/resources/icons/Add";
import { DragHandle } from "~/resources/icons/DragHandle";
import { Edit } from "~/resources/icons/Edit";
import { Info } from "~/resources/icons/Info";
import { OpenInNew } from "~/resources/icons/OpenInNew";
import { useLyricStore } from "../core/store";
import { moveLyricProvider } from "../core/actions";
import type { LyricProvider } from "../core/constants";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { cn } from "~/lib/style";
import { Links, openLink } from "~/lib/web-browser";
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
      <DragList
        data={lyricProviders}
        keyExtractor={({ id }) => id}
        estimatedItemSize={64}
        renderItem={(args) => <RenderItem {...args} />}
        onReordered={moveLyricProvider}
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

function RenderItem({ item, index }: DragListRenderItemInfo<LyricProvider>) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isActive, isDragging, onInitDrag } = useDragListState(index);

  return (
    <ListItem
      // @ts-expect-error - It gets applied to the `View`.
      collapsable={false}
      labelText={item.name}
      supportingText={item.endpoint}
      RightElement={
        <View className="flex-row">
          <IconButton
            Icon={Edit}
            accessibilityLabel={t("form.edit")}
            onPress={() =>
              navigation.navigate("ModifyLyricProvider", { id: item.id })
            }
            disabled={isDragging}
          />
          <IconButton
            Icon={DragHandle}
            accessibilityLabel={t("template.entryMove", { name: item.name })}
            onPressIn={onInitDrag}
          />
        </View>
      }
      className={cn("mb-4 py-1 pl-2", { "bg-surfaceContainerLow": isActive })}
    />
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

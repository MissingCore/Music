// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { DragListRenderItemInfo } from "@missingcore/ui/drag-list";
import { DragList, useDragListState } from "@missingcore/ui/drag-list";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Icon } from "~/resources/icons";
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
            icon="add"
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
          <ContentPlaceholder
            // @ts-expect-error - Will display text if key doesn't exist.
            errMsgKey={t("template.noContentFound", {
              name: t("feat.lyrics.extra.providers").toLocaleLowerCase(),
            })}
          />
        }
        className="-mb-4"
        contentContainerClassName="p-4"
        alwaysKeyRenderedItems
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
            icon="edit"
            accessibilityLabel={t("form.edit")}
            onPress={() =>
              navigation.navigate("ModifyLyricProvider", { id: item.id })
            }
            disabled={isDragging}
          />
          <IconButton
            icon="drag-handle"
            accessibilityLabel={t("template.entryMove", { name: item.name })}
            onPressIn={onInitDrag}
            disabled={isDragging && !isActive}
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
      className="mb-6 flex-row items-start pl-2"
    >
      <Icon name="info" size={20} color="onSurfaceVariant" />
      <StyledText dim className="shrink grow text-sm">
        {t("feat.lyrics.extra.providersInstructions.line1")}
        {"\n\n"}
        {t("feat.lyrics.extra.providersInstructions.line2")}
      </StyledText>
      <Icon name="open-in-new" />
    </Button>
  );
}

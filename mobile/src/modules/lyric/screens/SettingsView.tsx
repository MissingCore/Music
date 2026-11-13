// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { DragListRenderItemInfo } from "@missingcore/ui/drag-list";
import { DragList, useDragListState } from "@missingcore/ui/drag-list";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Icon } from "~/resources/icons";
import { useLyricStore } from "../core/store";
import { moveLyricProvider, toggleLyricStoreKey } from "../core/actions";
import type { LyricProvider } from "../core/constants";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { Links, openLink } from "~/lib/web-browser";
import { IconButton } from "~/components/Form/Button/Icon";
import { Switch } from "~/components/Form/Switch";
import { ListItem } from "~/components/List";
import { SegmentedList } from "~/components/List/Segmented";
import { TEm, TStyledText } from "~/components/Typography/StyledText";

export default function LyricsSettings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const checkEmbeddedLyrics = useLyricStore((s) => s.checkEmbedded);
  const lyricProviders = useLyricStore((s) => s.providers);

  return (
    <ListLayout>
      <SegmentedList.Item
        labelText="feat.lyrics.extra.useEmbedded"
        onPress={toggleLyricStoreKey("checkEmbedded")}
        Trailing={<Switch enabled={checkEmbeddedLyrics} />}
      />

      <TEm textKey="feat.lyrics.extra.providers" className="-mb-4" />
      <View className="flex-row items-center gap-3 rounded-lg border border-outlineVariant p-3">
        <Icon name="info" size={20} color="onSurfaceVariant" />
        <TStyledText
          textKey="feat.lyrics.extra.providersInstructions.line1"
          dim
          className="shrink grow"
        />
      </View>

      <SegmentedList>
        <SegmentedList.Item
          labelText="feat.lyrics.extra.providersInstructions.line2"
          onPress={() => openLink(Links.LyricsProviders)}
          Trailing={<Icon name="open-in-new" />}
        />
        <SegmentedList.CustomItem>
          <DragList
            data={lyricProviders}
            keyExtractor={({ id }) => id}
            estimatedItemSize={56}
            gestureHitSlop={OnRTL.decide(
              { width: 64, left: 0 },
              { width: 64, right: 0 },
            )}
            renderItem={(args) => <RenderItem {...args} />}
            onReordered={moveLyricProvider}
            ListFooterComponent={
              <IconButton
                icon="add"
                accessibilityLabel={t("form.create")}
                onPress={() => navigation.navigate("LyricProviderForm", {})}
                className="mt-2 self-center bg-onSurface px-6"
                _fullRipple
                _iconColor="surface"
              />
            }
            ListEmptyComponent={
              <ContentPlaceholder
                // @ts-expect-error - Will display text if key doesn't exist.
                errMsgKey={t("template.noContentFound", {
                  name: t("feat.lyrics.extra.providers").toLocaleLowerCase(),
                })}
              />
            }
            contentContainerClassName="p-4"
            alwaysKeyRenderedItems
          />
        </SegmentedList.CustomItem>
      </SegmentedList>
    </ListLayout>
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
      Trailing={
        <View className="flex-row">
          <IconButton
            icon="edit"
            accessibilityLabel={t("form.edit")}
            onPress={() =>
              navigation.navigate("LyricProviderForm", { providerId: item.id })
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

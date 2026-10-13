// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { DragListRenderItemInfo } from "@missingcore/ui/drag-list";
import { DragList, useDragListState } from "@missingcore/ui/drag-list";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useLyricStore } from "../core/store";
import { moveLyricProvider, toggleLyricStoreKey } from "../core/actions";
import type { LyricProvider } from "../core/constants";

import { ScrollLayout } from "~/navigation/layouts/ScrollLayout";
import * as SettingsList from "~/navigation/screens/settings/components/SettingsList";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { cn } from "~/lib/style";
import { Links } from "~/lib/web-browser";
import { IconButton } from "~/components/next/base/button-icon";
import { TText } from "~/components/next/base/typography";
import { Hint } from "~/components/next/blocks/hint";
import { TextStack } from "~/components/next/blocks/text-stack";

export default function LyricsSettings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const checkEmbeddedLyrics = useLyricStore((s) => s.checkEmbedded);
  const lyricProviders = useLyricStore((s) => s.providers);

  return (
    <ScrollLayout title="feat.lyrics.title">
      <SettingsList.Group>
        <SettingsList.ToggleItem
          icon="draft"
          label={t("feat.lyrics.extra.useEmbedded")}
          onToggle={toggleLyricStoreKey("checkEmbedded")}
          enabled={checkEmbeddedLyrics}
        />
      </SettingsList.Group>

      <View>
        <TText textKey="feat.lyrics.extra.providers" bold className="mb-2" />
        <Hint hint={t("feat.lyrics.extra.providersInstructions.line1")} />
      </View>
      <SettingsList.Group>
        <SettingsList.ExternalLinkItem
          icon="help"
          label={t("feat.lyrics.extra.providersInstructions.line2")}
          href={Links.LyricsProviders}
        />
        <SettingsList.Divider adjustForIcon={false} />
        <DragList
          data={lyricProviders}
          keyExtractor={({ id }) => id}
          estimatedItemSize={56}
          renderItem={(args) => <RenderItem {...args} />}
          onReordered={moveLyricProvider}
          ListFooterComponent={
            <IconButton
              icon="add"
              accessibilityLabel={t("form.create")}
              onPress={() => navigation.navigate("CreateLyricProvider")}
              intent="inverse"
              filled
              wide
              className="mt-2 self-center"
              _iconSize={32}
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
      </SettingsList.Group>
    </ScrollLayout>
  );
}

function RenderItem({ item, index }: DragListRenderItemInfo<LyricProvider>) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isActive, isDragging, onInitDrag } = useDragListState(index);

  return (
    <View
      className={cn("mb-2 flex-row gap-2 overflow-hidden rounded-lg p-2 pr-0", {
        "bg-surfaceContainer": isActive,
      })}
    >
      <TextStack label={item.name} supporting={item.endpoint} clamp />
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
    </View>
  );
}

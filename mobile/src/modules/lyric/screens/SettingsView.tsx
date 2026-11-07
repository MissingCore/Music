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
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { mutateGuard } from "~/lib/react-query";
import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { Links } from "~/lib/web-browser";
import {
  FilledIconButton,
  IconButton,
} from "~/components/next/base/button-icon";
import { TText } from "~/components/next/base/typography";
import { ScrollableSheet, useSheetRef } from "~/components/next/base/sheet";
import { Hint } from "~/components/next/blocks/hint";
import { TextStack } from "~/components/next/blocks/text-stack";
import { ActionButton } from "~/components/next/blocks/button-action";
import * as List from "~/components/next/composed/list";

import { useExportLyricsProviderBackup,useImportLyricsProviderBackup } from "../helpers/backupLyricProvider";

export default function LyricsSettings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const checkEmbeddedLyrics = useLyricStore((s) => s.checkEmbedded);
  const lyricProviders = useLyricStore((s) => s.providers);
  const sheetRef = useSheetRef();

  const exportBackup = useExportLyricsProviderBackup();
  const importBackup = useImportLyricsProviderBackup();

  const inProgress = exportBackup.isPending || importBackup.isPending;

  return (
    <>
    <ScrollLayout title="feat.lyrics.title">
      <List.Group>
        <List.ToggleItem
          icon="draft"
          label={t("feat.lyrics.extra.useEmbedded")}
          onToggle={toggleLyricStoreKey("checkEmbedded")}
          enabled={checkEmbeddedLyrics}
        />
      </List.Group>

      <View>
        <TText
          textKey="feat.lyrics.extra.providers"
          intent="em"
          className="mb-2"
        />
        <Hint hint={t("feat.lyrics.extra.providersInstructions.line1")} />
      </View>
      <List.Group>
        <List.ExternalLinkItem
          icon="help"
          label={t("feat.lyrics.extra.providersInstructions.line2")}
          href={Links.LyricsProviders}
        />
        <List.Divider adjustForIcon={false} />
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
            <View className="mt-2 w-full flex-row items-center justify-between">
              <FilledIconButton
                icon="swap-vert"
                accessibilityLabel={t("feat.backup.title")}
                onPress={() => sheetRef.current?.present()}
                intent="inverse"
                wide
              />

              <FilledIconButton
                icon="add"
                accessibilityLabel={t("form.create")}
                onPress={() => navigation.navigate("LyricProviderForm", {})}
                intent="inverse"
                wide
              />
              {/* Empty placeholder to balance the space so the second button stays centered */}
              <View className="w-15" />
            </View>
          }
          ListEmptyComponent={
            <ContentPlaceholder
              // @ts-expect-error - Will display text if key doesn't exist.
              errMsgKey={t("template.noContentFound", {
                name: t("feat.lyrics.extra.providers").toLocaleLowerCase(),
              })}
            />
          }
          contentContainerClassName="gap-y-2 p-4"
          alwaysKeyRenderedItems
        />
      </List.Group>
    </ScrollLayout>
    <ScrollableSheet ref={sheetRef}>
            <View className="flex-row items-center gap-0.75">
              <ActionButton
                label={t("feat.backup.extra.export")}
                onPress={() => mutateGuard(exportBackup, undefined)}
                disabled={inProgress}
                leadingIcon="download"
                className="flex-1 rounded-lg rounded-r-xs"
              />
              <ActionButton
                label={t("feat.backup.extra.import")}
                onPress={() => mutateGuard(importBackup, undefined)}
                disabled={inProgress}
                leadingIcon="upload"
                className="flex-1 rounded-lg rounded-l-xs"
              />
            </View>
            <Hint hint={t("feat.lyrics.extra.providersBackup")} />
          </ScrollableSheet>
    </>
  );
}

function RenderItem({ item, index }: DragListRenderItemInfo<LyricProvider>) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isActive, isDragging, onInitDrag } = useDragListState(index);

  return (
    <View
      className={cn("flex-row gap-2 overflow-hidden rounded-lg p-2 pr-0", {
        "bg-surfaceContainer": isActive,
      })}
    >
      <TextStack label={item.name} supporting={item.endpoint} clamp />
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
    </View>
  );
}

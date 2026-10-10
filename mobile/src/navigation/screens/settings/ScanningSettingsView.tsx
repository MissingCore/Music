// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";
import { useRescanForTracks } from "~/modules/startup/scanning/core/rescan";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { MinDurationSheet } from "./sheets/MinDurationSheet";
import { ScanFilterListSheet } from "./sheets/ScanFilterListSheet";
import { SeparatorsSheet } from "./sheets/SeparatorsSheet";
import * as SettingsList from "./components/SettingsList";

import { getAPIVersionCode } from "~/lib/device";
import { mutateGuard } from "~/lib/react-query";
import type { SheetRef } from "~/components/next/base/sheet";
import { useSheetRef } from "~/components/next/base/sheet";
import { ConfirmAction } from "~/components/next/composed/confirm-action";

export default function ScanningSettings() {
  const { t } = useTranslation();
  const rescanOnLaunch = usePreferenceStore((s) => s.rescanOnLaunch);
  const rescan = useRescanForTracks();
  const sheetRefs = ScanningConfigurations.useScanningSheetRefs();

  return (
    <>
      <ScanningConfigurations.Sheets {...sheetRefs} />
      <ListLayout>
        <SettingsList.Group>
          <SettingsList.Item
            icon="search"
            label={t("feat.rescan.title")}
            supporting={t("feat.rescan.brief")}
            onPress={() => mutateGuard(rescan, undefined)}
            disabled={rescan.isPending}
          />
          <SettingsList.Divider />
          <ConfirmAction prompt={[t("feat.deepRescan.title")]}>
            <SettingsList.Item
              icon="find-replace"
              label={t("feat.deepRescan.title")}
              supporting={t("feat.deepRescan.brief")}
              onPress={() => mutateGuard(rescan, true)}
              disabled={rescan.isPending}
            />
          </ConfirmAction>
        </SettingsList.Group>

        <SettingsList.Group>
          <SettingsList.ToggleItem
            icon="search-off"
            label={t("feat.rescanOnLaunch.title")}
            supporting={t("feat.rescanOnLaunch.brief")}
            onToggle={PreferenceTogglers.toggleKey("rescanOnLaunch")}
            enabled={rescanOnLaunch}
          />
          <SettingsList.Divider />
          <OptimizedImageSavingSetting />
          <SettingsList.Divider />
          <MediaStoreScannerSetting />
        </SettingsList.Group>

        <ScanningConfigurations.Settings {...sheetRefs} />
      </ListLayout>
    </>
  );
}

//#region Optimized Image Saving
export function OptimizedImageSavingSetting() {
  const { t } = useTranslation();
  const optimizedImageSave = usePreferenceStore((s) => s.optimizedImageSave);
  return (
    <ConfirmAction
      prompt={[
        t("feat.optimizedImageSave.description.line1"),
        t("feat.optimizedImageSave.description.line2"),
      ]}
      skipConfirmation={!optimizedImageSave}
    >
      <SettingsList.ToggleItem
        icon="image"
        label={t("feat.optimizedImageSave.title")}
        supporting={t("feat.optimizedImageSave.brief")}
        onToggle={PreferenceTogglers.toggleKey("optimizedImageSave")}
        enabled={optimizedImageSave}
      />
    </ConfirmAction>
  );
}
//#endregion

//#region MediaStore Scanner
export function MediaStoreScannerSetting() {
  const { t } = useTranslation();
  const mediaStoreScanner = usePreferenceStore((s) => s.mediaStoreScanner);
  return getAPIVersionCode() >= 30 ? (
    <SettingsList.ToggleItem
      icon="database-search"
      label={t("feat.scanning.extra.useMediaStore")}
      supporting={t("feat.scanning.extra.useMediaStoreBrief")}
      onToggle={PreferenceTogglers.toggleKey("mediaStoreScanner")}
      enabled={mediaStoreScanner}
    />
  ) : null;
}
//#endregion

//#region Scanning Configurations
type ScanningSheetRefs = {
  allowListSheetRef: SheetRef;
  blockListSheetRef: SheetRef;
  minDurationSheetRef: SheetRef;
  separatorsSheetRef: SheetRef;
};

export const ScanningConfigurations = {
  /** All settings which affects the content which gets saved. */
  Settings: memo(function ScanningConfigurations(props: ScanningSheetRefs) {
    const { t } = useTranslation();
    const allowList = usePreferenceStore((s) => s.listAllow);
    const blockList = usePreferenceStore((s) => s.listBlock);
    const ignoreDuration = usePreferenceStore((s) => s.minSeconds);
    const delimiters = usePreferenceStore((s) => s.separators);

    return (
      <>
        <SettingsList.Group>
          <SettingsList.Item
            icon="playlist-add-check"
            label={t("feat.listAllow.title")}
            supporting={t("plural.entry", { count: allowList.length })}
            onPress={() => props.allowListSheetRef.current?.present()}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            icon="playlist-remove"
            label={t("feat.listBlock.title")}
            supporting={t("plural.entry", { count: blockList.length })}
            onPress={() => props.blockListSheetRef.current?.present()}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            icon="timer"
            label={t("feat.minTrackDuration.title")}
            supporting={t("plural.second", { count: ignoreDuration })}
            onPress={() => props.minDurationSheetRef.current?.present()}
          />
        </SettingsList.Group>

        <SettingsList.Group>
          <SettingsList.Item
            icon="glyphs"
            label={t("feat.separators.title")}
            supporting={t("plural.entry", { count: delimiters.length })}
            onPress={() => props.separatorsSheetRef.current?.present()}
          />
        </SettingsList.Group>
      </>
    );
  }),

  /**
   * Sheets used in `<ScanningConfigurations.Settings />`. We can't define
   * them inside the component as React Native will throw the annoying
   * "VirtualizedLists should never be nested inside plain ScrollViews"
   * error message even though it's fine.
   */
  Sheets: memo(function ScanningConfigurationsSheets(props: ScanningSheetRefs) {
    return (
      <>
        <ScanFilterListSheet
          ref={props.allowListSheetRef}
          listType="listAllow"
        />
        <ScanFilterListSheet
          ref={props.blockListSheetRef}
          listType="listBlock"
        />
        <MinDurationSheet ref={props.minDurationSheetRef} />
        <SeparatorsSheet ref={props.separatorsSheetRef} />
      </>
    );
  }),

  /** Simple way of getting access to all the necessary sheet refs. */
  useScanningSheetRefs() {
    const allowListSheetRef = useSheetRef();
    const blockListSheetRef = useSheetRef();
    const minDurationSheetRef = useSheetRef();
    const separatorsSheetRef = useSheetRef();

    return useMemo(
      () => ({
        allowListSheetRef,
        blockListSheetRef,
        minDurationSheetRef,
        separatorsSheetRef,
      }),
      [
        allowListSheetRef,
        blockListSheetRef,
        minDurationSheetRef,
        separatorsSheetRef,
      ],
    );
  },
};
//#endregion

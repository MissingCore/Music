import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";
import { useRescanForTracks } from "~/modules/scanning/helpers/rescan";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { MinDurationSheet } from "./sheets/MinDurationSheet";
import { ScanFilterListSheet } from "./sheets/ScanFilterListSheet";
import { SeparatorsSheet } from "./sheets/SeparatorsSheet";

import { getAPIVersionCode } from "~/lib/device";
import { mutateGuard } from "~/lib/react-query";
import { SegmentedList } from "~/components/List/Segmented";
import { ConfirmableAction } from "~/components/Modal";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Switch } from "~/components/UI/Switch";

export default function ScanningSettings() {
  const { t } = useTranslation();
  const rescanOnLaunch = usePreferenceStore((s) => s.rescanOnLaunch);
  const rescan = useRescanForTracks();
  const sheetRefs = ScanningConfigurations.useScanningSheetRefs();

  return (
    <>
      <ScanningConfigurations.Sheets {...sheetRefs} />
      <ListLayout>
        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.rescan.title"
            supportingText={t("feat.rescan.brief")}
            disabled={rescan.isPending}
            onPress={() => mutateGuard(rescan, undefined)}
          />
          <ConfirmableAction
            Component={SegmentedList.Item}
            componentProps={{
              labelTextKey: "feat.deepRescan.title",
              supportingText: t("feat.deepRescan.brief"),
              disabled: rescan.isPending,
              onPress: () => mutateGuard(rescan, true),
            }}
            modalMessage={["feat.deepRescan.title"]}
          />
        </SegmentedList>

        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.rescanOnLaunch.title"
            supportingText={t("feat.rescanOnLaunch.brief")}
            onPress={PreferenceTogglers.toggleKey("rescanOnLaunch")}
            RightElement={<Switch enabled={rescanOnLaunch} />}
          />
          <OptimizedImageSavingSetting />
        </SegmentedList>

        <MediaStoreScannerSetting />

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
    <ConfirmableAction
      Component={SegmentedList.Item}
      componentProps={{
        labelTextKey: "feat.optimizedImageSave.title",
        supportingText: t("feat.optimizedImageSave.brief"),
        onPress: PreferenceTogglers.toggleKey("optimizedImageSave"),
        RightElement: <Switch enabled={optimizedImageSave} />,
      }}
      modalMessage={[
        "feat.optimizedImageSave.description.line1",
        "feat.optimizedImageSave.description.line2",
      ]}
      disableModal={!optimizedImageSave}
    />
  );
}
//#endregion

//#region MediaStore Scanner
export function MediaStoreScannerSetting() {
  const { t } = useTranslation();
  const mediaStoreScanner = usePreferenceStore((s) => s.mediaStoreScanner);

  return getAPIVersionCode() >= 30 ? (
    <SegmentedList.Item
      labelTextKey="feat.scanning.extra.useMediaStore"
      supportingText={t("feat.scanning.extra.useMediaStoreBrief")}
      onPress={PreferenceTogglers.toggleKey("mediaStoreScanner")}
      RightElement={<Switch enabled={mediaStoreScanner} />}
    />
  ) : null;
}
//#endregion

//#region Scanning Configurations
type ScanningSheetRefs = {
  allowListSheetRef: TrueSheetRef;
  blockListSheetRef: TrueSheetRef;
  minDurationSheetRef: TrueSheetRef;
  separatorsSheetRef: TrueSheetRef;
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
        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.listAllow.title"
            supportingText={t("plural.entry", { count: allowList.length })}
            onPress={() => props.allowListSheetRef.current?.present()}
          />
          <SegmentedList.Item
            labelTextKey="feat.listBlock.title"
            supportingText={t("plural.entry", { count: blockList.length })}
            onPress={() => props.blockListSheetRef.current?.present()}
          />
          <SegmentedList.Item
            labelTextKey="feat.minTrackDuration.title"
            supportingText={t("plural.second", { count: ignoreDuration })}
            onPress={() => props.minDurationSheetRef.current?.present()}
          />
        </SegmentedList>

        <SegmentedList.Item
          labelTextKey="feat.separators.title"
          supportingText={t("plural.entry", { count: delimiters.length })}
          onPress={() => props.separatorsSheetRef.current?.present()}
        />
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

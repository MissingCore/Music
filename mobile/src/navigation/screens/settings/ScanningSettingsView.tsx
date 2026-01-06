import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";
import { useRescanForTracks } from "~/modules/scanning/helpers/rescan";

import { StandardScrollLayout } from "~/navigation/layouts/StandardScroll";
import { MinDurationSheet } from "~/navigation/sheets/MinDurationSheet";
import { ScanFilterListSheet } from "~/navigation/sheets/ScanFilterListSheet";
import { SeparatorsSheet } from "~/navigation/sheets/SeparatorsSheet";

import { mutateGuard } from "~/lib/react-query";
import { SegmentedList } from "~/components/List/Segmented";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Switch } from "~/components/UI/Switch";

export default function ScanningSettings() {
  const { t } = useTranslation();
  const rescanOnLaunch = usePreferenceStore((s) => s.rescanOnLaunch);
  const allowList = usePreferenceStore((s) => s.listAllow);
  const blockList = usePreferenceStore((s) => s.listBlock);
  const ignoreDuration = usePreferenceStore((s) => s.minSeconds);
  const delimiters = usePreferenceStore((s) => s.separators);
  const rescan = useRescanForTracks();
  const allowListSheetRef = useSheetRef();
  const blockListSheetRef = useSheetRef();
  const minDurationSheetRef = useSheetRef();
  const separatorsSheetRef = useSheetRef();

  return (
    <>
      <ScanFilterListSheet ref={allowListSheetRef} listType="listAllow" />
      <ScanFilterListSheet ref={blockListSheetRef} listType="listBlock" />
      <MinDurationSheet ref={minDurationSheetRef} />
      <SeparatorsSheet ref={separatorsSheetRef} />

      <StandardScrollLayout>
        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.rescan.title"
            supportingText={t("feat.rescan.brief")}
            disabled={rescan.isPending}
            onPress={() => mutateGuard(rescan, undefined)}
          />
          <SegmentedList.Item
            labelTextKey="feat.deepRescan.title"
            supportingText={t("feat.deepRescan.brief")}
            disabled={rescan.isPending}
            onPress={() => mutateGuard(rescan, true)}
          />
        </SegmentedList>

        <SegmentedList.Item
          labelTextKey="feat.rescanOnLaunch.title"
          supportingText={t("feat.rescanOnLaunch.brief")}
          onPress={PreferenceTogglers.toggleRescanOnLaunch}
          RightElement={<Switch enabled={rescanOnLaunch} />}
        />

        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.listAllow.title"
            supportingText={t("plural.entry", { count: allowList.length })}
            onPress={() => allowListSheetRef.current?.present()}
          />
          <SegmentedList.Item
            labelTextKey="feat.listBlock.title"
            supportingText={t("plural.entry", { count: blockList.length })}
            onPress={() => blockListSheetRef.current?.present()}
          />
          <SegmentedList.Item
            labelTextKey="feat.minTrackDuration.title"
            supportingText={t("plural.second", { count: ignoreDuration })}
            onPress={() => minDurationSheetRef.current?.present()}
          />
        </SegmentedList>

        <SegmentedList.Item
          labelTextKey="feat.separators.title"
          supportingText={t("plural.entry", { count: delimiters.length })}
          onPress={() => separatorsSheetRef.current?.present()}
        />
      </StandardScrollLayout>
    </>
  );
}

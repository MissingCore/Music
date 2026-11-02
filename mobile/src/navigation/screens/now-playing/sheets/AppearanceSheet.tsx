// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import {
  PreferenceSetters,
  PreferenceTogglers,
} from "~/stores/Preference/actions";
import {
  NowPlayingDesignOptions,
  SeekbarDesignOptions,
} from "~/stores/Preference/constants";

import type { SheetRef } from "~/components/next/base/sheet";
import { ScrollableSheet } from "~/components/next/base/sheet";
import { SegmentedPicker } from "~/components/next/blocks/segmented-picker";
import { TText } from "~/components/next/base/typography";
import * as List from "~/components/next/composed/list";

export function AppearanceSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const nowPlayingDesign = usePreferenceStore((s) => s.nowPlayingDesign);
  const alternativeInfoLayout = usePreferenceStore(
    (s) => s.alternativeInfoLayout,
  );
  const standardVinylSpeed = usePreferenceStore((s) => s.standardVinylSpeed);
  const seekbarDesign = usePreferenceStore((s) => s.seekbarDesign);

  const artworkPickerOptions = NowPlayingDesignOptions.map((option) => ({
    label: t(`feat.nowPlayingDesign.extra.${option}`),
    value: option,
  }));

  const seekbarPickerOptions = SeekbarDesignOptions.map((option) => ({
    label: t(`feat.seekbar.extra.${option}`),
    value: option,
  }));

  return (
    <ScrollableSheet ref={props.ref}>
      <List.Group>
        <List.ToggleItem
          label={t("feat.nowPlayingDesign.extra.alternativeInfoLayout")}
          enabled={alternativeInfoLayout}
          onToggle={PreferenceTogglers.toggleKey("alternativeInfoLayout")}
        />
        <List.Divider adjustForIcon={false} />
        <List.ToggleItem
          label={t("feat.nowPlayingDesign.extra.standardVinylSpeed")}
          enabled={standardVinylSpeed}
          onToggle={PreferenceTogglers.toggleKey("alternativeInfoLayout")}
        />
      </List.Group>

      <TText
        textKey="feat.artwork.title"
        intent="em"
        size="sm"
        className="-mb-2"
      />
      <SegmentedPicker
        type="radio"
        numColumns={2}
        accessibilityLabel={t("feat.artwork.title")}
        options={artworkPickerOptions}
        selected={nowPlayingDesign}
        onSelect={PreferenceSetters.setNowPlayingDesign}
      />

      <TText
        textKey="feat.seekbar.title"
        intent="em"
        size="sm"
        className="-mb-2"
      />
      <SegmentedPicker
        type="radio"
        numColumns={2}
        accessibilityLabel={t("feat.seekbar.title")}
        options={seekbarPickerOptions}
        selected={seekbarDesign}
        onSelect={PreferenceSetters.setSeekbarDesign}
      />
    </ScrollableSheet>
  );
}

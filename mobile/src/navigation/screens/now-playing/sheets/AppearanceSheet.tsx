// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { usePreferenceStore } from "~/stores/Preference/store";
import {
  PreferenceSetters,
  PreferenceTogglers,
} from "~/stores/Preference/actions";

import { RadioChipField } from "~/components/Form/Radio";
import { SwitchInput } from "~/components/Form/Switch";
import { DetachedSheet } from "~/components/Sheet";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import {
  NowPlayingDesignOptions,
  SeekbarDesignOptions,
} from "~/stores/Preference/constants";

export function AppearanceSheet(props: { ref: TrueSheetRef }) {
  const nowPlayingDesign = usePreferenceStore((s) => s.nowPlayingDesign);
  const alternativeInfoLayout = usePreferenceStore(
    (s) => s.alternativeInfoLayout,
  );
  const seekbarDesign = usePreferenceStore((s) => s.seekbarDesign);

  return (
    <DetachedSheet ref={props.ref}>
      <SheetLabelAction
        labelKey="feat.nowPlayingDesign.extra.alternativeInfoLayout"
        Trailing={
          <SwitchInput
            enabled={alternativeInfoLayout}
            onPress={PreferenceTogglers.toggleKey("alternativeInfoLayout")}
          />
        }
      />

      <RadioChipField labelKey="feat.artwork.title">
        {NowPlayingDesignOptions.map((design) => (
          <RadioChipField.Item
            key={design}
            labelKey={`feat.nowPlayingDesign.extra.${design}`}
            selected={nowPlayingDesign === design}
            onSelect={() => PreferenceSetters.setNowPlayingDesign(design)}
          />
        ))}
      </RadioChipField>

      <RadioChipField labelKey="feat.seekbar.title">
        {SeekbarDesignOptions.map((design) => (
          <RadioChipField.Item
            key={design}
            labelKey={`feat.seekbar.extra.${design}`}
            selected={seekbarDesign === design}
            onSelect={() => PreferenceSetters.setSeekbarDesign(design)}
          />
        ))}
      </RadioChipField>
    </DetachedSheet>
  );
}

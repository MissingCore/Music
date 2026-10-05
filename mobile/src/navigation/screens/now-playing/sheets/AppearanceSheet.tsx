// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { usePreferenceStore } from "~/stores/Preference/store";
import {
  PreferenceSetters,
  PreferenceTogglers,
} from "~/stores/Preference/actions";
import {
  NowPlayingDesignOptions,
  SeekbarDesignOptions,
} from "~/stores/Preference/constants";

import { RadioChipField } from "~/components/Form/Radio";
import { SwitchInput } from "~/components/Form/Switch";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";

export function AppearanceSheet(props: { ref: SheetRef }) {
  const nowPlayingDesign = usePreferenceStore((s) => s.nowPlayingDesign);
  const alternativeInfoLayout = usePreferenceStore(
    (s) => s.alternativeInfoLayout,
  );
  const standardVinylSpeed = usePreferenceStore((s) => s.standardVinylSpeed);
  const seekbarDesign = usePreferenceStore((s) => s.seekbarDesign);

  return (
    <Sheet ref={props.ref}>
      <SheetLabelAction
        labelKey="feat.nowPlayingDesign.extra.alternativeInfoLayout"
        Trailing={
          <SwitchInput
            enabled={alternativeInfoLayout}
            onPress={PreferenceTogglers.toggleKey("alternativeInfoLayout")}
          />
        }
      />
      <SheetLabelAction
        labelKey="feat.nowPlayingDesign.extra.standardVinylSpeed"
        Trailing={
          <SwitchInput
            enabled={standardVinylSpeed}
            onPress={PreferenceTogglers.toggleKey("standardVinylSpeed")}
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
    </Sheet>
  );
}

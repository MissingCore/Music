// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { RadioChipField } from "~/components/Form/Radio";
import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { NowPlayingDesignOptions } from "~/stores/Preference/constants";

export function AppearanceSheet(props: { ref: TrueSheetRef }) {
  const nowPlayingDesign = usePreferenceStore((s) => s.nowPlayingDesign);
  return (
    <DetachedSheet ref={props.ref}>
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
    </DetachedSheet>
  );
}

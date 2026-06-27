// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { DetachedNumericSheet } from "~/components/Sheet/Numeric";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";

export function MinDurationSheet(props: { ref: TrueSheetRef }) {
  const minSeconds = usePreferenceStore((s) => s.minSeconds);
  return (
    <DetachedNumericSheet
      ref={props.ref}
      titleKey="feat.minTrackDuration.title"
      descriptionKey="feat.minTrackDuration.description"
      value={minSeconds}
      setValue={PreferenceSetters.setMinSeconds}
      maxLength={2} // Max out at 99 seconds.
    />
  );
}

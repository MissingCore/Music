import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { FlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import type { TrueSheetRef } from "~/components/Sheet";
import { DetachedSheet } from "~/components/Sheet/Detached";
import { TStyledText } from "~/components/Typography/StyledText";
import { NowPlayingDesignOptions } from "~/stores/Preference/constants";

/** @deprecated We plan on integrating this setting in a different sheet. */
export function NowPlayingDesignSheet(props: { ref: TrueSheetRef }) {
  const nowPlayingDesign = usePreferenceStore((s) => s.nowPlayingDesign);
  return (
    <DetachedSheet ref={props.ref} titleKey="feat.nowPlayingDesign.title">
      <FlatList
        accessibilityRole="radiogroup"
        data={NowPlayingDesignOptions}
        keyExtractor={(design) => design}
        renderItem={({ item: design }) => (
          <Radio
            selected={nowPlayingDesign === design}
            onSelect={() => PreferenceSetters.setNowPlayingDesign(design)}
          >
            <TStyledText textKey={`feat.nowPlayingDesign.extra.${design}`} />
          </Radio>
        )}
        contentContainerClassName="gap-2"
      />
    </DetachedSheet>
  );
}

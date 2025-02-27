import {
  NowPlayingDesignOptions,
  useUserPreferencesStore,
} from "~/services/UserPreferences";

import { FlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import { Sheet } from "~/components/Sheet";
import { TStyledText } from "~/components/Typography/StyledText";

/** Sheet allowing us to change the design used on the "Now Playing" screen. */
export default function NowPlayingDesignSheet() {
  const nowPlayingDesign = useUserPreferencesStore(
    (state) => state.nowPlayingDesign,
  );
  const setNowPlayingDesign = useUserPreferencesStore(
    (state) => state.setNowPlayingDesign,
  );

  return (
    <Sheet id="NowPlayingDesignSheet" titleKey="feat.nowPlayingDesign.title">
      <FlatList
        accessibilityRole="radiogroup"
        data={NowPlayingDesignOptions}
        keyExtractor={(design) => design}
        renderItem={({ item: design }) => (
          <Radio
            selected={nowPlayingDesign === design}
            onSelect={() => setNowPlayingDesign(design)}
          >
            <TStyledText textKey={`feat.nowPlayingDesign.extra.${design}`} />
          </Radio>
        )}
        contentContainerClassName="gap-1"
      />
    </Sheet>
  );
}

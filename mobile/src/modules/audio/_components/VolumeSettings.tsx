import { playbackStore, usePlaybackStore } from "~/stores/Playback/store";

import { SegmentedList } from "~/components/List/Segmented";
import { Switch } from "~/components/UI/Switch";

export function VolumeSettings() {
  const restoreVolume = usePlaybackStore((s) => s.restoreVolume);
  return (
    <SegmentedList>
      <SegmentedList.Item
        labelTextKey="feat.playback.extra.restoreVolume"
        onPress={toggleRestoreVolume}
        RightElement={<Switch enabled={restoreVolume} />}
      />
    </SegmentedList>
  );
}

function toggleRestoreVolume() {
  playbackStore.setState((prev) => ({ restoreVolume: !prev.restoreVolume }));
}

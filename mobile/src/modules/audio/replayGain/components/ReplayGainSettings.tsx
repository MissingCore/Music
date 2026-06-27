// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { usePlaybackStore } from "~/stores/Playback/store";
import { toggleStatus } from "../core/actions";

import { cn } from "~/lib/style";
import { Divider } from "~/components/Divider";
import { SegmentedList } from "~/components/List/Segmented";
import { TStyledText } from "~/components/Typography/StyledText";
import { Switch } from "~/components/UI/Switch";
import { PreAmpSlider } from "./PreAmpSlider";

export function ReplayGainSettings() {
  const isReplayGainEnabled = usePlaybackStore((s) => s.isReplayGainEnabled);
  return (
    <SegmentedList>
      <SegmentedList.Item
        labelTextKey="feat.replayGain.title"
        onPress={toggleStatus}
        RightElement={<Switch enabled={isReplayGainEnabled} />}
      />
      <SegmentedList.CustomItem className="p-4">
        <View
          needsOffscreenAlphaCompositing={!isReplayGainEnabled}
          renderToHardwareTextureAndroid={!isReplayGainEnabled}
          className={cn("gap-4", { "opacity-25": !isReplayGainEnabled })}
        >
          <TStyledText
            textKey="feat.replayGain.extra.preAmp"
            className="-mb-3.5 text-sm"
          />
          <TStyledText textKey="feat.replayGain.extra.preAmpDescription" dim />
          <Divider />
          <PreAmpSlider field="preAmpWTags" disabled={!isReplayGainEnabled} />
          <PreAmpSlider field="preAmpWOTags" disabled={!isReplayGainEnabled} />
        </View>
      </SegmentedList.CustomItem>
    </SegmentedList>
  );
}

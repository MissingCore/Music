// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { SegmentedList } from "~/components/List/Segmented";
import { TEm } from "~/components/Typography/StyledText";
import { Switch } from "~/components/UI/Switch";

export default function PlaybackSettings() {
  const { t } = useTranslation();
  const continuePlaybackOnDismiss = usePreferenceStore(
    (s) => s.continuePlaybackOnDismiss,
  );
  const dragClearPlayback = usePreferenceStore((s) => s.dragClearPlayback);
  const miniplayerGestures = usePreferenceStore((s) => s.miniplayerGestures);
  const nowPlayingArtworkControls = usePreferenceStore(
    (s) => s.nowPlayingArtworkControls,
  );
  const nowPlayingGestures = usePreferenceStore((s) => s.nowPlayingGestures);
  const quickAddQueue = usePreferenceStore((s) => s.quickAddQueue);
  const quickFavorite = usePreferenceStore((s) => s.quickFavorite);
  const repeatOnSkip = usePreferenceStore((s) => s.repeatOnSkip);
  const restoreLastPosition = usePreferenceStore((s) => s.restoreLastPosition);

  return (
    <ListLayout>
      <SegmentedList>
        <SegmentedList.Item
          labelTextKey="feat.continuePlaybackOnDismiss.title"
          supportingText={t("feat.continuePlaybackOnDismiss.description")}
          onPress={PreferenceTogglers.toggleContinuePlaybackOnDismiss}
          RightElement={<Switch enabled={continuePlaybackOnDismiss} />}
        />
        <SegmentedList.Item
          labelTextKey="feat.restoreLastPosition.title"
          onPress={PreferenceTogglers.toggleKey("restoreLastPosition")}
          RightElement={<Switch enabled={restoreLastPosition} />}
        />
      </SegmentedList>

      <SegmentedList.Item
        labelTextKey="feat.repeatOnSkip.title"
        supportingText={t("feat.repeatOnSkip.brief")}
        onPress={PreferenceTogglers.toggleKey("repeatOnSkip")}
        RightElement={<Switch enabled={repeatOnSkip} />}
      />

      <TEm textKey="feat.miniplayer.title" className="-mb-4" />
      <SegmentedList>
        <SegmentedList.Item
          labelTextKey="feat.miniplayer.extra.swipeControls"
          onPress={PreferenceTogglers.toggleKey("miniplayerGestures")}
          RightElement={<Switch enabled={miniplayerGestures} />}
        />
        <SegmentedList.Item
          labelTextKey="feat.miniplayer.extra.dragToDismiss"
          onPress={PreferenceTogglers.toggleKey("dragClearPlayback")}
          RightElement={<Switch enabled={dragClearPlayback} />}
        />
      </SegmentedList>

      <TEm textKey="feat.nowPlaying.title" className="-mb-4" />
      <SegmentedList>
        <SegmentedList.Item
          labelTextKey="feat.nowPlaying.extra.artworkPlaybackToggle"
          onPress={PreferenceTogglers.toggleKey("nowPlayingArtworkControls")}
          RightElement={<Switch enabled={nowPlayingArtworkControls} />}
        />
        <SegmentedList.Item
          labelTextKey="feat.miniplayer.extra.swipeControls"
          onPress={PreferenceTogglers.toggleKey("nowPlayingGestures")}
          RightElement={<Switch enabled={nowPlayingGestures} />}
        />
      </SegmentedList>

      <TEm
        textKey="feat.modalTrack.extra.trackQuickActions"
        className="-mb-4"
      />
      <SegmentedList>
        <SegmentedList.Item
          labelTextKey="term.favorite"
          onPress={PreferenceTogglers.toggleKey("quickFavorite")}
          RightElement={<Switch enabled={quickFavorite} />}
        />
        <SegmentedList.Item
          labelTextKey="feat.queue.extra.add"
          onPress={PreferenceTogglers.toggleKey("quickAddQueue")}
          RightElement={<Switch enabled={quickAddQueue} />}
        />
      </SegmentedList>
    </ListLayout>
  );
}

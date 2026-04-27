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

      <SegmentedList>
        <SegmentedList.Item
          labelTextKey="feat.miniplayerGestures.title"
          onPress={PreferenceTogglers.toggleKey("miniplayerGestures")}
          RightElement={<Switch enabled={miniplayerGestures} />}
        />
        <SegmentedList.Item
          labelTextKey="feat.miniplayerGestures.extra.dragClearPlayback"
          onPress={PreferenceTogglers.toggleKey("dragClearPlayback")}
          RightElement={<Switch enabled={dragClearPlayback} />}
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

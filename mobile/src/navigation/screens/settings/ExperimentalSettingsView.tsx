// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { Directory } from "expo-file-system";
import { useTranslation } from "react-i18next";

import { db } from "~/db";
import {
  albums,
  artists,
  genres,
  playlists,
  tracks,
  waveformSamples,
} from "~/db/schema";

import { Icon } from "~/resources/icons";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";
import { sessionStore } from "~/stores/Session/store";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { ImageDirectory } from "~/lib/file-system";
import { Links, openLink } from "~/lib/web-browser";
import { SegmentedList } from "~/components/List/Segmented";
import { ConfirmableAction } from "~/components/Modal";
import { Switch } from "~/components/UI/Switch";

export default function ExperimentalSettings() {
  const { t } = useTranslation();
  const queueAwareNext = usePreferenceStore((s) => s.queueAwareNext);
  const downsamplingProcessor = usePreferenceStore(
    (s) => s.downsamplingProcessor,
  );

  return (
    <ListLayout>
      <SegmentedList.Item
        labelTextKey="feat.queue.extra.queueAwareNext"
        supportingText={t("feat.queue.extra.queueAwareNextBrief")}
        onPress={PreferenceTogglers.toggleQueueAwareNext}
        RightElement={<Switch enabled={queueAwareNext} />}
      />

      <SegmentedList.Item
        labelText="Downsample High Sample Rate Audio (192kHz+)"
        supportingText="Downsamples high sample rate audio files to 192kHz so that they can be played instead of throwing an error. This will eventually be the default behavior. Disable this feature if you encounter issues."
        onPress={PreferenceTogglers.toggleDownsamplingProcessor}
        RightElement={<Switch enabled={downsamplingProcessor} />}
      />

      <ConfirmableAction
        Component={SegmentedList.Item}
        componentProps={{
          labelTextKey: "feat.waveformSlider.extra.purgeCache",
          supportingText: t("feat.waveformSlider.extra.purgeCacheBrief"),
          onPress: purgeWaveformCache,
        }}
        modalMessage={["feat.waveformSlider.extra.purgeCache"]}
      />

      <SegmentedList.Item
        labelText="Android Auto"
        onPress={() => openLink(Links.AndroidAuto)}
        RightElement={<Icon name="open-in-new" />}
      />

      <ConfirmableAction
        Component={SegmentedList.Item}
        componentProps={{
          labelText: "Delete All Stored Images",
          supportingText:
            "Delete all stored images to switch to the new hashed artwork strategy, which should make disabling the `Optimized Image Saving` feature less impactful (ie: using more storage from saving the same artwork over and over again).",
          onPress: deleteAllImages,
        }}
        modalMessage={[
          // @ts-expect-error - If we use a non-translation key, it'll be rendered as a string.
          "Re-launching the app is necessary after confirming this action.",
          // @ts-expect-error - If we use a non-translation key, it'll be rendered as a string.
          "You will need to re-add any images you manually assigned to albums/artists/genres/playlists/tracks.",
        ]}
      />
    </ListLayout>
  );
}

//#region Helpers
async function purgeWaveformCache() {
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  await db.delete(waveformSamples);
  sessionStore.setState({ activeWaveformContext: null });
  toast.t("feat.waveformSlider.extra.purgeCacheToast");
}

/** Delete all images from the database, setting `fetchedArt` to `false`. */
async function deleteAllImages() {
  const dir = new Directory(ImageDirectory);
  dir.delete();

  // eslint-disable-next-line drizzle/enforce-update-with-where
  await db.update(artists).set({ artwork: null });
  // eslint-disable-next-line drizzle/enforce-update-with-where
  await db.update(albums).set({ embeddedArtwork: null, altArtwork: null });
  // eslint-disable-next-line drizzle/enforce-update-with-where
  await db
    .update(tracks)
    .set({ embeddedArtwork: null, altArtwork: null, fetchedArt: false });
  // eslint-disable-next-line drizzle/enforce-update-with-where
  await db.update(playlists).set({ artwork: null });
  // eslint-disable-next-line drizzle/enforce-update-with-where
  await db.update(genres).set({ artwork: null });
}
//#endregion

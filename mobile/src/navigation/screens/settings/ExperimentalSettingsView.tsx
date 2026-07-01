// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useQuery } from "@tanstack/react-query";
import { eq, like } from "drizzle-orm";
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
import { queryClient } from "~/lib/react-query";
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
  const { data: unhashedImagesCount } = useUnhashedImagesCount();

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

      {unhashedImagesCount !== undefined && unhashedImagesCount !== 0 ? (
        <ConfirmableAction
          Component={SegmentedList.Item}
          componentProps={{
            labelText: `Delete ${unhashedImagesCount} Unhashed Images`,
            supportingText: `Delete ${unhashedImagesCount} unhashed images to switch to the new hashed artwork strategy, which should make disabling the \`Optimized Image Saving\` feature less impactful (ie: using more storage from saving the same artwork over and over again).`,
            onPress: deleteAllUnhashedImages,
          }}
          modalMessage={[
            // @ts-expect-error - If we use a non-translation key, it'll be rendered as a string.
            "Re-launching the app is necessary after confirming this action.",
            // @ts-expect-error - If we use a non-translation key, it'll be rendered as a string.
            "You will need to re-add any images you manually assigned to albums/artists/genres/playlists/tracks.",
          ]}
        />
      ) : null}
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

const queryKey = ["has-unhashed-images"];

async function getUnhashedImagesCount() {
  const knownHashedImages = await db.query.hashedImages.findMany();
  const dir = new Directory(ImageDirectory);
  return dir.list().length - knownHashedImages.length;
}

function useUnhashedImagesCount() {
  return useQuery({ queryKey, queryFn: getUnhashedImagesCount });
}

/** Delete all unhashed images from the database, setting `fetchedArt` to `false`. */
async function deleteAllUnhashedImages() {
  //? Remove all unhashed images in the database (basically any artwork
  //? field with a value starting with `file://`).
  await db
    .update(artists)
    .set({ artwork: null })
    .where(like(artists.artwork, "file://%"));
  await db
    .update(genres)
    .set({ artwork: null })
    .where(like(genres.artwork, "file://%"));
  await db
    .update(playlists)
    .set({ artwork: null })
    .where(like(playlists.artwork, "file://%"));
  await db
    .update(albums)
    .set({ embeddedArtwork: null })
    .where(like(albums.embeddedArtwork, "file://%"));
  await db
    .update(albums)
    .set({ altArtwork: null })
    .where(like(albums.altArtwork, "file://%"));
  await db
    .update(tracks)
    .set({ embeddedArtwork: null })
    .where(like(tracks.embeddedArtwork, "file://%"));
  await db
    .update(tracks)
    .set({ altArtwork: null })
    .where(like(tracks.altArtwork, "file://%"));
  await db
    .update(tracks)
    .set({ fetchedArt: false })
    .where(eq(tracks.fetchedArt, true));

  //? Delete all images that aren't hashed.
  const knownHashedImages = await db.query.hashedImages.findMany();
  const hashedImageURIs = new Set(knownHashedImages.map(({ uri }) => uri));

  const dir = new Directory(ImageDirectory);
  for (const file of dir.list()) {
    // Only images should be stored in this directory.
    if (hashedImageURIs.has(file.uri)) continue;
    file.delete();
  }

  await queryClient.resetQueries({ queryKey });
}
//#endregion

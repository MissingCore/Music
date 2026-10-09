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

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";
import { sessionStore } from "~/stores/Session/store";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import * as SettingsList from "./components/SettingsList";

import { ImageDirectory } from "~/lib/file-system";
import { queryClient } from "~/lib/react-query";
import { Links } from "~/lib/web-browser";
import { ConfirmAction } from "~/components/next/composed/confirm-action";

export default function ExperimentalSettings() {
  const { t } = useTranslation();
  const queueAwareNext = usePreferenceStore((s) => s.queueAwareNext);
  const atmosphereEffect = usePreferenceStore((s) => s.atmosphereEffect);
  const opaqueColors = usePreferenceStore((s) => s.opaqueColors);
  const { data: unhashedImagesCount } = useUnhashedImagesCount();

  return (
    <ListLayout>
      <SettingsList.Group>
        <SettingsList.ToggleItem
          icon="mist"
          label={t("feat.theme.extra.atmosphere")}
          onToggle={PreferenceTogglers.toggleKey("atmosphereEffect")}
          enabled={atmosphereEffect}
        />
        <SettingsList.Divider />
        <SettingsList.ToggleItem
          icon="opacity"
          label={t("feat.theme.extra.opaqueColors")}
          onToggle={PreferenceTogglers.toggleKey("opaqueColors")}
          enabled={opaqueColors}
        />
      </SettingsList.Group>

      <SettingsList.Group>
        <SettingsList.ToggleItem
          icon="queue-music"
          label={t("feat.queue.extra.queueAwareNext")}
          supporting={t("feat.queue.extra.queueAwareNextBrief")}
          onToggle={PreferenceTogglers.toggleQueueAwareNext}
          enabled={queueAwareNext}
        />
      </SettingsList.Group>

      <SettingsList.Group>
        <SettingsList.ExternalLinkItem
          icon="directions-car"
          label="Android Auto"
          href={Links.AndroidAuto}
        />
      </SettingsList.Group>

      <SettingsList.Group>
        <ConfirmAction prompt={[t("feat.seekbar.extra.waveformPurgeCache")]}>
          <SettingsList.Item
            icon="delete"
            label={t("feat.seekbar.extra.waveformPurgeCache")}
            supporting={t("feat.seekbar.extra.waveformPurgeCacheBrief")}
            onPress={purgeWaveformCache}
          />
        </ConfirmAction>
        {unhashedImagesCount !== undefined && unhashedImagesCount !== 0 ? (
          <>
            <SettingsList.Divider />
            <ConfirmAction
              prompt={[
                "Re-launching the app is necessary after confirming this action.",
                "You will need to re-add any images you manually assigned to albums/artists/genres/playlists/tracks.",
              ]}
            >
              <SettingsList.Item
                icon="delete"
                label={`Delete ${unhashedImagesCount} Unhashed Images`}
                supporting={`Delete ${unhashedImagesCount} unhashed images to switch to the new hashed artwork strategy, which should make disabling the \`Optimized Image Saving\` feature less impactful (ie: using more storage from saving the same artwork over and over again).`}
                onPress={deleteAllUnhashedImages}
              />
            </ConfirmAction>
          </>
        ) : null}
      </SettingsList.Group>
    </ListLayout>
  );
}

//#region Helpers
async function purgeWaveformCache() {
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  await db.delete(waveformSamples);
  sessionStore.setState({ activeWaveformContext: null });
  toast.t("feat.seekbar.extra.waveformPurgeCacheToast");
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

// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { eq, inArray } from "drizzle-orm";
import { useTranslation } from "react-i18next";
import { z } from "zod/mini";

import { db } from "~/db";
import type { albums } from "~/db/schema";
import { albumsToArtists, tracks, tracksToGenres } from "~/db/schema";

import { updateAlbum, upsertAlbums } from "~/data/album/api";
import { useAlbum } from "~/data/album/queries";
import { AlbumArtistsKey } from "~/data/album/utils";
import { createArtists } from "~/data/artist/api";
import { createGenres } from "~/data/genre/api";
import { Resynchronize } from "~/stores/Playback/actions";
import { AppCleanUp } from "~/modules/startup/scanning/core/cleanup";

import { router } from "~/navigation/utils/router";
import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { clearAllQueries } from "~/lib/react-query";
import { Divider } from "~/components/next/base/divider";
import { Hint } from "~/components/next/blocks/hint";
import { ZSchema } from "~/modules/form/utils";
import { Form } from "~/modules/form/FormState";
import { createTypedFormInputs } from "~/modules/form/FormState/FormInput";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyAlbum({
  route: {
    params: { id },
  },
}: Props) {
  const { isPending, data, error } = useAlbum(id);
  if (isPending || error) return <PagePlaceholder isPending={isPending} />;
  return (
    <Form.Provider
      type="edit"
      schema={AlbumMetadataSchema}
      initData={{
        albumContext: {
          id: data.id,
          name: data.name,
          artistsKey: data.artistsKey,
          isEP: data.isEP,
          trackIds: data.tracks.map((t) => t.id),
        },
        name: data.name,
        artists: AlbumArtistsKey.deconstruct(data.artistsKey),
        isEP: data.isEP,
        year: null,
        genres: [],
      }}
      onSubmit={onEditAlbum}
      omittedFields={["albumContext"]}
      //? Prevent duplicates.
      onConstraints={({ artists, genres }) =>
        artists.length ===
          new Set(artists.map((artist) => artist.trim())).size &&
        genres.length === new Set(genres.map((genre) => genre.trim())).size
      }
    >
      <Form.Toolbar />
      <FormContents />
    </Form.Provider>
  );
}

//#region Form Contents
const FormInput = createTypedFormInputs<AlbumMetadata>();

function FormContents() {
  const { t } = useTranslation();
  return (
    <Form.Container>
      <Form.Title />
      <FormInput.Text label="feat.trackMetadata.extra.name" field="name" />
      <FormInput.Array label="term.artists" field="artists" />
      <FormInput.Switch label="isEP" field="isEP" />
      <Divider />
      <Hint hint={t("feat.trackMetadata.extra.overrideFields")} />
      <FormInput.Numeric label="feat.trackMetadata.extra.year" field="year" />
      <FormInput.Array label="term.genres" field="genres" />
    </Form.Container>
  );
}
//#endregion

//#region Schema
const AlbumMetadataSchema = z.object({
  // Additional context:
  albumContext: z.object({
    id: z.string(),
    name: z.string(),
    artistsKey: z.string(),
    isEP: z.boolean(),
    trackIds: z.array(ZSchema.NonEmptyString),
  }),
  // Actual form fields:
  name: ZSchema.NonEmptyString,
  artists: z.array(ZSchema.NonEmptyString).check(z.minLength(1)),
  isEP: z.boolean(),
  // Fields applied to current tracks:
  year: ZSchema.NullableRealNumber,
  genres: z.array(ZSchema.NonEmptyString),
});

type AlbumMetadata = z.infer<typeof AlbumMetadataSchema>;
//#endregion

//#region Submit Handler
async function onEditAlbum(data: AlbumMetadata) {
  try {
    const {
      albumContext: { id: albumId, trackIds, ...ctx },
      year,
      genres,
      ...albumBase
    } = data;

    //? We shouldn't be able to edit an album if it has no tracks.
    if (trackIds.length === 0) return router.back();

    //? 1. First update year & genres on tracks if specified (as we don't
    //? want to override unrelated tracks if the album gets changed).
    if (year !== null) {
      await db.update(tracks).set({ year }).where(inArray(tracks.id, trackIds));
    }

    if (genres.length > 0) {
      await createGenres(genres.map((name) => ({ name })));
      await db.transaction(async (tx) => {
        await tx
          .delete(tracksToGenres)
          .where(inArray(tracksToGenres.trackId, trackIds));
        await tx
          .insert(tracksToGenres)
          .values(
            genres.flatMap((genreName) =>
              trackIds.map((trackId) => ({ trackId, genreName })),
            ),
          );
      });
    }

    //? 2. Update the album entry.
    const albumContent: Partial<typeof albums.$inferInsert> = {};
    if (ctx.name !== albumBase.name) albumContent.name = albumBase.name;
    const artistsKey = AlbumArtistsKey.from(albumBase.artists);
    if (!artistsKey) throw new Error("`artistsKey` somehow not generated.");
    if (ctx.artistsKey !== artistsKey) albumContent.artistsKey = artistsKey;
    if (ctx.isEP !== albumBase.isEP) albumContent.isEP = albumBase.isEP;

    let returnedAlbumId: string | undefined = albumId;
    if (Object.keys(albumContent).length > 0) {
      try {
        await updateAlbum(albumId, albumContent);
        //? If we're updating `artistsKey`, we need to re-create those relations.
        if (albumContent.artistsKey) {
          await createArtists(albumBase.artists.map((name) => ({ name })));
          await db.transaction(async (tx) => {
            await tx
              .delete(albumsToArtists)
              .where(eq(albumsToArtists.albumId, albumId));
            await tx.insert(albumsToArtists).values(
              albumBase.artists.map((artistName) => ({
                albumId,
                artistName,
              })),
            );
          });
        }
      } catch (err) {
        //? If we don't get a constraint error, then propagate the error.
        const constraintErrMsg =
          "UNIQUE constraint failed: albums.name, albums.artists_key";
        if (!(err as Error).message.includes(constraintErrMsg)) throw err;

        //? If we crash, then an album with the changed `name` or `artistsKey`
        //? already exists. In that case, we use that album's id.
        const upsertContent = { ...ctx, ...albumContent };
        const [updatedAlbum] = await upsertAlbums([upsertContent]);
        //? This should be defined.
        returnedAlbumId = updatedAlbum?.id;

        if (returnedAlbumId)
          await db
            .update(tracks)
            .set({ albumId: returnedAlbumId })
            .where(inArray(tracks.id, trackIds));
      }
    }

    //? 3. Revalidate `activeTrack` in Playback store if needed.
    await Resynchronize.onActiveTrack({ type: "album", id: albumId });
    await AppCleanUp.media();
    clearAllQueries();
    router.back();
    router.navigate("Album", { id: returnedAlbumId ?? albumId });
  } catch {
    toast.tError("err.flow.generic.title");
  }
}
//#endregion

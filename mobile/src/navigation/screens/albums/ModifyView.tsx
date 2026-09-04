// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { eq, inArray } from "drizzle-orm";
import { View } from "react-native";
import { z } from "zod/mini";

import { db } from "~/db";
import type { albums } from "~/db/schema";
import { albumsToArtists, tracks, tracksToGenres } from "~/db/schema";

import { Icon } from "~/resources/icons";
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
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { Divider } from "~/components/Divider";
import { SwitchInput } from "~/components/Form/Switch";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import { TStyledText } from "~/components/Typography/StyledText";
import { ZSchema } from "~/modules/form/utils";
import {
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState";
import {
  ArrayFormInputImpl,
  FormInputImpl,
} from "~/modules/form/FormState/FormInput";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyAlbum({
  route: {
    params: { id },
  },
}: Props) {
  const { isPending, data, error } = useAlbum(id);
  if (isPending || error) return <PagePlaceholder isPending={isPending} />;
  return (
    <FormStateProvider
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
      <MetadataForm />
    </FormStateProvider>
  );
}

//#region Metadata Form
const FormInput = FormInputImpl<AlbumMetadata>();
const ArrayFormInput = ArrayFormInputImpl<AlbumMetadata>();

function MetadataForm() {
  const { data, setFields, isSubmitting } = useFormState();
  return (
    <KeyboardAwareScrollView contentContainerClassName="bottom-safe-offset-4 gap-4 p-4">
      <FormInput label="feat.trackMetadata.extra.name" field="name" />
      <ArrayFormInput label="term.artists" field="artists" />
      <SheetLabelAction
        label="isAlbumEP"
        Trailing={
          <SwitchInput
            enabled={data.isEP}
            onPress={() => setFields((prev) => ({ isEP: !prev.isEP }))}
            disabled={isSubmitting}
          />
        }
      />
      <Divider />
      <View className="flex-row gap-2 rounded-md bg-surfaceContainerLowest p-4 pl-2">
        <Icon name="info" size={20} color="onSurfaceVariant" />
        <TStyledText
          textKey="feat.trackMetadata.extra.overrideFields"
          dim
          className="shrink grow text-sm"
        />
      </View>
      <FormInput label="feat.trackMetadata.extra.year" field="year" numeric />
      <ArrayFormInput label="term.genres" field="genres" />
    </KeyboardAwareScrollView>
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

function useFormState() {
  return useFormStateContext<AlbumMetadata>();
}
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

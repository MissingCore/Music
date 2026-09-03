// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { inArray } from "drizzle-orm";
import { z } from "zod/mini";

import { db } from "~/db";
import { tracks, tracksToGenres } from "~/db/schema";

import { upsertAlbums } from "~/data/album/api";
import { useAlbum } from "~/data/album/queries";
import { AlbumArtistsKey } from "~/data/album/utils";
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
        id: data.id,
        trackIds: data.tracks.map((t) => t.id),
        name: data.name,
        artists: AlbumArtistsKey.deconstruct(data.artistsKey),
        isEP: data.isEP,
        year: null,
        genres: [],
      }}
      onSubmit={onEditAlbum}
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
      <FormInput label="feat.trackMetadata.extra.year" field="year" numeric />
      <ArrayFormInput label="term.genres" field="genres" />
    </KeyboardAwareScrollView>
  );
}
//#endregion

//#region Schema
const AlbumMetadataSchema = z.object({
  // Additional context:
  id: z.string(),
  trackIds: z.array(ZSchema.NonEmptyString),
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
    const { id: albumId, trackIds, year, genres, ...albumBase } = data;

    //? First update year & genres on tracks if specified (as we don't
    //? want to override unrelated tracks if the album gets changed).
    if (trackIds.length > 0) {
      if (year !== null) {
        await db
          .update(tracks)
          .set({ year })
          .where(inArray(tracks.id, trackIds));
      }

      if (genres.length > 0) {
        const genreEntries = genres.flatMap((genreName) =>
          trackIds.map((trackId) => ({ trackId, genreName })),
        );
        await createGenres(genres.map((name) => ({ name })));
        await db.transaction(async (tx) => {
          await tx
            .delete(tracksToGenres)
            .where(inArray(tracksToGenres.trackId, trackIds));
          await tx.insert(tracksToGenres).values(genreEntries);
        });
      }
    }

    //? If we change `name` & `artistsKey` to an album that already exists,
    //? we replace this album with that album.
    const [updatedAlbum] = await upsertAlbums([
      {
        name: albumBase.name,
        artistsKey: AlbumArtistsKey.from(albumBase.artists)!,
        isEP: albumBase.isEP,
      },
    ]);

    if (trackIds.length > 0 && updatedAlbum && updatedAlbum.id !== albumId) {
      await db
        .update(tracks)
        .set({ albumId: updatedAlbum.id })
        .where(inArray(tracks.id, trackIds));
    }

    // Revalidate `activeTrack` in Playback store if needed.
    await Resynchronize.onActiveTrack({ type: "album", id: albumId });
    await AppCleanUp.media();
    clearAllQueries();
    router.back();
  } catch {
    toast.tError("err.flow.generic.title");
  }
}
//#endregion

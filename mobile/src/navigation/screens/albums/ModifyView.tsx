// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { eq } from "drizzle-orm";
import { z } from "zod/mini";

import { db } from "~/db";
import { tracksToArtists, tracksToGenres } from "~/db/schema";

import { upsertAlbums } from "~/data/album/api";
import { useAlbum } from "~/data/album/queries";
import { AlbumArtistsKey } from "~/data/album/utils";
import { createArtists } from "~/data/artist/api";
import { createGenres } from "~/data/genre/api";
import { updateTrack } from "~/data/track/api";
import { Resynchronize } from "~/stores/Playback/actions";
import { preferenceStore } from "~/stores/Preference/store";
import { getArtworkHash } from "~/modules/startup/scanning/core/artwork";
import { AppCleanUp } from "~/modules/startup/scanning/core/cleanup";

import { router } from "~/navigation/utils/router";
import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { clearAllQueries } from "~/lib/react-query";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
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
        name: data.name,
        artists: AlbumArtistsKey.deconstruct(data.artistsKey),
        isEP: data.isEP,
        year: null,
        genres: [],
      }}
      onSubmit={onEditAlbum}
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
  // Actual form fields:
  name: ZSchema.NonEmptyString,
  artists: z.array(ZSchema.NonEmptyString),
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
    clearAllQueries();
    router.back();
  } catch {
    toast.tError("err.flow.generic.title");
  }
}
//#endregion

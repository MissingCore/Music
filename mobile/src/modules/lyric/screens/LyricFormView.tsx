// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import * as v from "valibot";

import { queries as q } from "~/data/keyStore";
import { createLyric, deleteLyric, updateLyric } from "~/data/lyric/api";
import { useTrackLyrics } from "~/data/track/queries";

import { useFloatingContent } from "~/navigation/hooks/useFloatingContent";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { pickFile } from "~/lib/file-system";
import { wait } from "~/utils/promise";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import type { FABWorkflowConfig } from "~/modules/form/FormState";
import { FABWorkflow, FormStateProvider } from "~/modules/form/FormState";
import { TextareaImpl } from "~/modules/form/FormState/FormInput";
import { FormSchema } from "~/modules/form/utils";

type Props = StaticScreenProps<{ trackId: string }>;

export default function LyricForm({
  route: {
    params: { trackId },
  },
}: Props) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isPending, isRefetching, data } = useTrackLyrics(trackId);
  const { offset, floatingContentProps } = useFloatingContent();

  //#region Create Flow
  const createAction = useMemo<FABWorkflowConfig<LyricEntry>>(
    () => ({
      label: "feat.backup.extra.import",
      action: async ({ setFields }) => {
        try {
          const lrcFile = await pickFile(["application/lrc", "text/plain"]);
          const lrcText = await lrcFile.text();
          await wait(100);
          toast.t("feat.backup.extra.importSuccess");
          setFields({ lyricText: lrcText });
        } catch (err) {
          toast.error((err as Error).message);
        }
      },
    }),
    [],
  );

  const onCreate = useCallback(
    async (entry: LyricEntry) => {
      try {
        const newLyric = await createLyric(entry);
        if (!newLyric) {
          //? Lyric not returned after insertion.
          toast.tError("err.flow.generic.title");
          return;
        }
        queryClient.invalidateQueries({
          queryKey: q.tracks.detail(trackId)._ctx.lyrics.queryKey,
        });
        navigation.goBack();
      } catch {
        toast.tError("err.flow.generic.title");
      }
    },
    [navigation, queryClient, trackId],
  );
  //#endregion

  //#region Modify Flow
  const deleteAction = useMemo<FABWorkflowConfig<LyricEntry>>(
    () => ({
      label: "form.delete",
      action: async () => {
        await wait(1);
        try {
          await deleteLyric(trackId);
          queryClient.invalidateQueries({
            queryKey: q.tracks.detail(trackId)._ctx.lyrics.queryKey,
          });
          navigation.goBack();
        } catch {
          toast.tError("err.flow.generic.title");
        }
      },
      danger: true,
    }),
    [navigation, queryClient, trackId],
  );

  const onUpdate = useCallback(
    async ({ lyricText }: LyricEntry) => {
      try {
        await updateLyric(trackId, { lyricText });
        queryClient.invalidateQueries({
          queryKey: q.tracks.detail(trackId)._ctx.lyrics.queryKey,
        });
        navigation.goBack();
      } catch {
        toast.tError("err.flow.generic.title");
      }
    },
    [navigation, queryClient, trackId],
  );
  //#endregion

  const hasLyrics = Boolean(data);

  if (isPending || isRefetching) return null;
  return (
    <FormStateProvider
      schema={LyricEntrySchema}
      initData={{ trackId, lyricText: data?.lyricText ?? "" }}
      onSubmit={hasLyrics ? onUpdate : onCreate}
    >
      <ScreenOptions title={hasLyrics ? "form.edit" : "form.create"} />
      <FormContents bottomOffset={offset} />
      <FABWorkflow
        {...(hasLyrics ? deleteAction : createAction)}
        floatingContentProps={floatingContentProps}
      />
    </FormStateProvider>
  );
}

//#region Form Contents
const Textarea = TextareaImpl<LyricEntry>();

function FormContents({ bottomOffset }: { bottomOffset: number }) {
  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ paddingBottom: bottomOffset }}
      contentContainerClassName="gap-6 p-4"
    >
      <Textarea label="feat.lyrics.title" field="lyricText" />
    </KeyboardAwareScrollView>
  );
}
//#endregion

//#region Schema
const LyricEntrySchema = v.object({
  trackId: FormSchema.NonEmptyString,
  lyricText: FormSchema.NonEmptyString,
});

type LyricEntry = v.InferOutput<typeof LyricEntrySchema>;
//#endregion

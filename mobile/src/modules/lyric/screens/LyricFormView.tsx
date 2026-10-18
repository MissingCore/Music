// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from "zod/mini";

import { queries as q } from "~/data/keyStore";
import { createLyric, deleteLyric, updateLyric } from "~/data/lyric/api";
import { useTrackLyrics } from "~/data/track/queries";

import { pickFile } from "~/lib/file-system";
import { OnRTL } from "~/lib/react";
import { wait } from "~/utils/promise";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { IconButton } from "~/components/next/base/button-icon";
import { Card } from "~/components/next/base/card";
import { ZSchema } from "~/modules/form/utils";
import type { FormActionConfig } from "~/modules/form/FormState/next";
import {
  FormAction,
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState/next";
import { TextareaImpl } from "~/modules/form/FormState/FormInputNext";
import { TText } from "~/components/next/base/typography";

type Props = StaticScreenProps<{ trackId: string }>;

export default function LyricForm({
  route: {
    params: { trackId },
  },
}: Props) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isPending, isRefetching, data } = useTrackLyrics(trackId);

  //#region Create Flow
  const createAction = useMemo<FormActionConfig<LyricEntry>>(
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
      actionConfig: {
        icon: "upload",
        intent: "secondary",
        filled: true,
        wide: true,
      },
    }),
    [],
  );

  const onCreate = useCallback(
    async (entry: LyricEntry) => {
      try {
        const newLyric = await createLyric(entry);
        if (!newLyric) throw new Error("Lyric not returned after insertion.");
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
  const deleteAction = useMemo<FormActionConfig<LyricEntry>>(
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
      actionConfig: {
        icon: "delete",
        intent: "error",
        filled: true,
        wide: true,
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

  return (
    <View className="flex-1 items-center justify-center bg-black/50 p-4 py-20">
      {!isPending && !isRefetching ? (
        <FormStateProvider
          schema={LyricEntrySchema}
          initData={{ trackId, lyricText: data?.lyricText ?? "" }}
          onSubmit={hasLyrics ? onUpdate : onCreate}
        >
          <Form actionConfig={hasLyrics ? deleteAction : createAction} />
        </FormStateProvider>
      ) : null}
    </View>
  );
}

//#region Lyric Form
const Textarea = TextareaImpl<LyricEntry>();

function Form(props: { actionConfig: FormActionConfig<LyricEntry> }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { canSubmit, isSubmitting, onSubmit } = useFormState();

  return (
    <Card className="size-full max-h-144 max-w-xl gap-6">
      <TText textKey="feat.lyrics.title" bold size="lg" className="-mb-4" />
      <View className="shrink grow overflow-hidden rounded-lg border border-outline">
        <KeyboardAwareScrollView contentContainerClassName="grow">
          <Textarea field="lyricText" className="grow rounded-none border-0" />
        </KeyboardAwareScrollView>
      </View>

      <View className="flex-row items-center gap-1.5">
        <FormAction {...props.actionConfig} />
        <IconButton
          icon={OnRTL.decide("east", "west")}
          accessibilityLabel={t("form.cancel")}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
          wide
          className="ml-auto"
        />
        <IconButton
          icon="save"
          accessibilityLabel={t("form.apply")}
          onPress={onSubmit}
          disabled={!canSubmit || isSubmitting}
          intent="inverse"
          filled
          wide
        />
      </View>
    </Card>
  );
}
//#endregion

//#region Schema
const LyricEntrySchema = z.object({
  trackId: ZSchema.NonEmptyString,
  lyricText: ZSchema.NonEmptyString,
});

type LyricEntry = z.infer<typeof LyricEntrySchema>;
//#endregion

//#region Internal
function useFormState() {
  return useFormStateContext<LyricEntry>();
}
//#endregion

// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { usePlaylistsNames } from "~/data/playlist/queries";
import { sanitizePlaylistName } from "~/data/playlist/utils";
import { addSelectedToCreatedPlaylist } from "../core/actions";

import { TextInput } from "~/components/Form/Input";
import { Icon } from "~/components/next/base/icon";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { TText } from "~/components/next/base/typography";
import { ActionButton } from "~/components/next/blocks/button-action";
import { useInputForm } from "~/modules/form/useInputForm";
import { FavoritesPlaylistKey } from "../../constants";

export function AddToCreatedPlaylistSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const { data: playlistsNames } = usePlaylistsNames();
  const invalidPlaylistNames = useMemo(
    () => new Set([...(playlistsNames ?? []), FavoritesPlaylistKey]),
    [playlistsNames],
  );

  const inputForm = useInputForm({
    onSubmit: async (trimmedName) => {
      props.ref.current?.dismiss();
      await addSelectedToCreatedPlaylist(trimmedName);
    },
    onConstraints: (trimmedName) => {
      // Checks to see if playlist name is unique.
      let isUnique = false;
      try {
        const sanitized = sanitizePlaylistName(trimmedName);
        isUnique = !invalidPlaylistNames.has(sanitized);
      } catch {}
      return isUnique;
    },
  });

  const constraintColor = !inputForm.canSubmit ? "onSurfaceVariant" : undefined;

  return (
    <Sheet ref={props.ref}>
      <Sheet.Header label={t("feat.modalTrack.extra.addToPlaylist")} />

      <TextInput
        editable={!inputForm.isSubmitting}
        value={inputForm.value}
        onChangeText={inputForm.onChange}
        placeholder={t("feat.trackMetadata.extra.name")}
        className="shrink grow rounded-sm border border-outline p-2"
        forSheet
      />
      <View className="-mt-4 shrink flex-row items-center gap-0.5">
        <Icon
          name={inputForm.canSubmit ? "check-circle" : "cancel"}
          size={16}
          color={constraintColor}
        />
        <TText
          textKey="form.validation.unique"
          size="xs"
          className={constraintColor}
        />
      </View>
      <ActionButton
        label={t("form.create")}
        onPress={inputForm.onSubmit}
        disabled={!inputForm.canSubmit || inputForm.isSubmitting}
        intent="secondary"
        className="rounded-full"
      />
    </Sheet>
  );
}

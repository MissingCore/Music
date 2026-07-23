// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Icon } from "~/resources/icons";
import { usePlaylistsNames } from "~/data/playlist/queries";
import { sanitizePlaylistName } from "~/data/playlist/utils";
import { addSelectedToCreatedPlaylist } from "../core/actions";

import { cn } from "~/lib/style";
import { ExtendedTButton } from "~/components/Form/Button";
import { TextInput } from "~/components/Form/Input";
import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { TStyledText } from "~/components/Typography/StyledText";
import { useInputForm } from "~/modules/form/useInputForm";
import { FavoritesPlaylistKey } from "../../constants";

export function AddToCreatedPlaylistSheet(props: { ref: TrueSheetRef }) {
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
    <DetachedSheet
      ref={props.ref}
      titleKey="feat.modalTrack.extra.addToPlaylist"
    >
      <TextInput
        editable={!inputForm.isSubmitting}
        value={inputForm.value}
        onChangeText={inputForm.onChange}
        placeholder={t("feat.trackMetadata.extra.name")}
        className="shrink grow rounded-sm border border-outline p-2"
        forSheet
      />
      <View className="-mt-5 shrink flex-row items-center gap-0.5">
        <Icon
          name={inputForm.canSubmit ? "check-circle" : "cancel"}
          size={16}
          color={constraintColor}
        />
        <TStyledText
          textKey="form.validation.unique"
          className={cn("text-xs", constraintColor)}
        />
      </View>
      <ExtendedTButton
        textKey="form.create"
        onPress={inputForm.onSubmit}
        disabled={!inputForm.canSubmit || inputForm.isSubmitting}
        className="rounded-full bg-secondary"
        textClassName="text-onSecondary"
        rippleColor="secondaryDim"
      />
    </DetachedSheet>
  );
}

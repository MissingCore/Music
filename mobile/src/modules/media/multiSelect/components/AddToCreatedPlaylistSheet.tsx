import { toast } from "@missingcore/ui/toast";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Icon } from "~/resources/icons";
import { createPlaylist } from "~/data/playlist/api";
import { usePlaylistsNames } from "~/data/playlist/queries";
import { sanitizePlaylistName } from "~/data/playlist/utils";
import { TrackMultiSelect, trackMultiSelectStore } from "../core/store";

import { clearAllQueries } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { wait } from "~/utils/promise";
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
      const selectedTracks = trackMultiSelectStore.getState().selected;
      props.ref.current?.dismiss();
      TrackMultiSelect.reset();
      await wait(1);
      await createPlaylist({
        name: trimmedName,
        tracks: Array.from(selectedTracks).map((id) => ({ id })),
      });
      clearAllQueries();
    },
    onError: () => {
      toast.tError("err.flow.generic.title");
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
        className="rounded-full bg-secondary active:bg-secondaryDim"
        textClassName="text-onSecondary"
      />
    </DetachedSheet>
  );
}

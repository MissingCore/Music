// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useArtists } from "~/data/artist/queries";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { useViewOrder } from "~/stores/ViewPreference/hooks/useViewOrder";

import * as LibraryLayout from "~/navigation/layouts/LibrayLayout";
import { ArtistsViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import type { ExtractQueryData } from "~/lib/react-query";
import { createTextPlaceholder } from "~/components/next/composed/media-image";

type ArtistData = ExtractQueryData<typeof useArtists>[number];

export default function Artists() {
  const asGrid = useViewPreferenceStore((s) => s.artistLayout !== "list");
  return (
    <LibraryLayout.Provider asGrid={asGrid}>
      <LibraryLayout.Header
        titleKey="term.artists"
        OptionsSheet={ArtistsViewOptionsSheet}
      />
      <ScreenContents />
    </LibraryLayout.Provider>
  );
}

function ScreenContents() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, data } = useArtists();

  const sortedData = useViewOrder("artist", data);
  const formatData = useCallback(
    (item: ArtistData) => ({
      id: item.name,
      title: item.name,
      description: t("plural.track", { count: item.trackCount }),
      imageSource: item.artwork ?? createTextPlaceholder(item.name),
    }),
    [t],
  );

  const formattedData = useMemo(
    () => sortedData?.map(formatData),
    [sortedData, formatData],
  );

  return (
    <LibraryLayout.MediaList
      data={formattedData}
      onPress={(id) => navigation.navigate("Artist", { id })}
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending || sortedData === undefined}
          errMsgKey="err.msg.noArtists"
          className="absolute inset-0 pt-safe-offset-36"
        />
      }
    />
  );
}

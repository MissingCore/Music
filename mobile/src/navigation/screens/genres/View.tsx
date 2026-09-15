// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useGenres } from "~/data/genre/queries";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { useViewOrder } from "~/stores/ViewPreference/hooks/useViewOrder";

import * as LibraryLayout from "~/navigation/layouts/LibrayLayout";
import { GenresViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import type { ExtractQueryData } from "~/lib/react-query";
import { createTextPlaceholder } from "~/components/next/composed/media-image";

type GenreData = ExtractQueryData<typeof useGenres>[number];

export default function Genres() {
  const asGrid = useViewPreferenceStore((s) => s.genreLayout !== "list");
  return (
    <LibraryLayout.Provider asGrid={asGrid}>
      <LibraryLayout.Header
        titleKey="term.genres"
        OptionsSheet={GenresViewOptionsSheet}
      />
      <ScreenContents />
    </LibraryLayout.Provider>
  );
}

function ScreenContents() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, data } = useGenres();

  const sortedData = useViewOrder("genre", data);
  const formatData = useCallback(
    (item: GenreData) => ({
      id: item.name,
      title: item.name,
      description: t("plural.track", { count: item.trackCount }),
      imageSource: item.artwork ?? createTextPlaceholder(item.name, true),
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
      onPress={(id) => navigation.navigate("Genre", { id })}
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending || sortedData === undefined}
          errMsgKey="err.msg.noGenres"
        />
      }
    />
  );
}

import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useGenres } from "~/queries/genre";
import { useViewLayout } from "~/stores/ViewPreference/hooks/useViewLayout";
import { useViewOrder } from "~/stores/ViewPreference/hooks/useViewOrder";

import { GenresViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";
import { NScrollListLayout } from "~/navigation/layouts/NScrollLayout";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import type { ExtractQueryData } from "~/lib/react-query";

type GenreData = ExtractQueryData<typeof useGenres>[number];

export default function Genres() {
  const { t } = useTranslation();
  const { isPending, data } = useGenres();

  const sortedData = useViewOrder("genre", data);
  const formatData = useCallback(
    (item: GenreData) => ({
      id: item.name,
      title: item.name,
      description: t("plural.track", { count: item.trackCount }),
      imageSource: item.artwork,
    }),
    [t],
  );
  const presets = useViewLayout("genre", sortedData, formatData);

  return (
    <NScrollListLayout
      titleKey="term.genres"
      OptionsSheet={GenresViewOptionsSheet}
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending || presets.data === undefined}
          errMsgKey="err.msg.noGenres"
        />
      }
      {...presets}
    />
  );
}

import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useArtists } from "~/queries/artist";
import { useViewLayout } from "~/stores/ViewPreference/hooks/useViewLayout";
import { useViewOrder } from "~/stores/ViewPreference/hooks/useViewOrder";

import { ArtistsViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";
import { NScrollListLayout } from "~/navigation/layouts/NScrollListLayout";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import type { ExtractQueryData } from "~/lib/react-query";

type ArtistData = ExtractQueryData<typeof useArtists>[number];

export default function Artists() {
  const { t } = useTranslation();
  const { isPending, data } = useArtists();

  const sortedData = useViewOrder("artist", data);
  const formatData = useCallback(
    (item: ArtistData) => ({
      id: item.name,
      title: item.name,
      description: t("plural.track", { count: item.trackCount }),
      imageSource: item.artwork,
    }),
    [t],
  );
  const presets = useViewLayout("artist", sortedData, formatData);

  return (
    <NScrollListLayout
      titleKey="term.artists"
      OptionsSheet={ArtistsViewOptionsSheet}
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending}
          errMsgKey="err.msg.noArtists"
        />
      }
      {...presets}
    />
  );
}

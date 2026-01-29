import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useArtists } from "~/queries/artist";
import { useViewLayout } from "~/stores/ViewPreference/hooks";

import {
  NScrollListHeader,
  NScrollListLayout,
} from "~/navigation/layouts/NScrollListLayout";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { ArtistsViewOptionsSheet } from "./sheets/ViewOptionsSheet";

import type { ExtractQueryData } from "~/lib/react-query";

export default function Artists() {
  const { t } = useTranslation();
  const { isPending, data } = useArtists();

  const formatData = useCallback(
    (item: ExtractQueryData<typeof useArtists>[number]) => ({
      id: item.name,
      title: item.name,
      description: t("plural.track", { count: item.trackCount }),
      imageSource: item.artwork,
    }),
    [t],
  );
  const presets = useViewLayout("artist", data, formatData);

  return (
    <>
      <NScrollListHeader
        titleKey="term.artists"
        OptionsSheet={ArtistsViewOptionsSheet}
      />
      <NScrollListLayout
        ListEmptyComponent={
          <ContentPlaceholder
            isPending={isPending}
            errMsgKey="err.msg.noArtists"
          />
        }
        {...presets}
      />
    </>
  );
}

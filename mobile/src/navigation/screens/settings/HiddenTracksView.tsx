import { useQuery } from "@tanstack/react-query";
import { isNotNull } from "drizzle-orm";
import { useTranslation } from "react-i18next";

import { tracks } from "~/db/schema";
import { getTracks } from "~/api/track";

import { VisibilityOff } from "~/resources/icons/VisibilityOff";
import { useHideTrack } from "~/queries/track";

import { mutateGuard } from "~/lib/react-query";
import { FlashList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button";
import { SearchResult } from "~/modules/search/components/SearchResult";
import { ContentPlaceholder } from "../../components/Placeholder";

export default function HiddenTracks() {
  const { t } = useTranslation();
  const { isPending, data } = useHiddenTracks();
  const hideTrack = useHideTrack();

  return (
    <FlashList
      estimatedItemSize={56} // 48px Height + 8px Margin Top
      data={data}
      keyExtractor={({ id }) => id}
      extraData={hideTrack.isPending}
      renderItem={({ item, index }) => (
        <SearchResult
          type="track"
          title={item.name}
          description={t("feat.hiddenTracks.extra.hiddenAt", {
            date: new Date(item.hiddenAt!).toDateString(),
          })}
          imageSource={item.artwork}
          RightElement={
            <IconButton
              Icon={VisibilityOff}
              accessibilityLabel={t("template.entryShow", { name: item.name })}
              onPress={() =>
                mutateGuard(hideTrack, { trackId: item.id, isHidden: false })
              }
              disabled={hideTrack.isPending}
            />
          }
          className={index > 0 ? "mt-2" : undefined}
        />
      )}
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending}
          errMsgKey="feat.hiddenTracks.extra.notFound"
        />
      }
      contentContainerClassName="p-4"
    />
  );
}

//#region Data Query
async function getHiddenTracks() {
  return getTracks({
    where: [isNotNull(tracks.hiddenAt)],
    columns: ["id", "name", "artwork", "hiddenAt"],
    albumColumns: ["artwork"],
    withHidden: true,
  });
}

const queryKey = ["settings", "hidden-tracks"];

function useHiddenTracks() {
  return useQuery({
    queryKey,
    queryFn: getHiddenTracks,
    select: (data) => {
      // FIXME: Once Hermes supports `toSorted`, use it instead.
      // Both `hiddenAt` should technically be not `null`.
      data.sort((a, b) => b.hiddenAt! - a.hiddenAt!);
      return data;
    },
    staleTime: 0,
  });
}
//#endregion

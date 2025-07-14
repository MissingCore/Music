import { useTranslation } from "react-i18next";

import { VisibilityOff } from "~/icons/VisibilityOff";
import { useHiddenTracks } from "~/queries/setting";
import { useToggleHideTrack } from "~/queries/track";

import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { FlashList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button";
import { ContentPlaceholder } from "~/components/Transition/Placeholder";
import { SearchResult } from "~/modules/search/components/SearchResult";

/** Screen for `/setting/insights/hidden` route. */
export default function HiddenTracksScreen() {
  const { t } = useTranslation();
  const { isPending, data } = useHiddenTracks();
  const toggleHideTrack = useToggleHideTrack();

  return (
    <FlashList
      estimatedItemSize={56} // 48px Height + 8px Margin Top
      data={data}
      keyExtractor={({ id }) => id}
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
                mutateGuard(toggleHideTrack, { trackId: item.id, hide: false })
              }
              disabled={toggleHideTrack.isPending}
            />
          }
          className={cn("bg-canvas", { "mt-2": index > 0 })}
        />
      )}
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending}
          errMsgKey="err.msg.noContent"
        />
      }
      contentContainerClassName="p-4"
    />
  );
}

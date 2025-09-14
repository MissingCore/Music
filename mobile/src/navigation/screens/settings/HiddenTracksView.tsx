import { useTranslation } from "react-i18next";

import { VisibilityOff } from "~/resources/icons/VisibilityOff";
import { useHiddenTracks } from "~/queries/setting";
import { useHideTrack } from "~/queries/track";

import { mutateGuard } from "~/lib/react-query";
import { FlashList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button";
import { ContentPlaceholder } from "~/components/Transition/Placeholder";
import { SearchResult } from "~/modules/search/components/SearchResult";

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

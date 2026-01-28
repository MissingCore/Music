import { useTranslation } from "react-i18next";

import { MoreHoriz } from "~/resources/icons/MoreHoriz";
import { useArtists } from "~/queries/artist";
import { useViewLayout } from "~/stores/ViewPreference/hooks";

import { NScrollListLayout } from "~/navigation/layouts/NScrollListLayout";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { ArtistsViewOptionsSheet } from "./sheets/ViewOptionsSheet";

import type { ExtractQueryData } from "~/lib/react-query";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { Marquee } from "~/components/Marquee";
import { SafeContainer } from "~/components/SafeContainer";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { AccentText } from "~/components/Typography/AccentText";
import type { LayoutItem } from "~/stores/ViewPreference/types";

export default function Artists() {
  const { t } = useTranslation();
  const { isPending, data } = useArtists();
  const presets = useViewLayout("artist", data, formatData);
  const artistsViewOptionsSheetRef = useSheetRef();

  return (
    <>
      <ArtistsViewOptionsSheet ref={artistsViewOptionsSheetRef} />

      <SafeContainer
        additionalTopOffset={16}
        className="flex-row items-center justify-between gap-2 p-4"
      >
        <Marquee>
          <AccentText className="text-4xl">{t("term.artists")}</AccentText>
        </Marquee>
        <FilledIconButton
          Icon={MoreHoriz}
          accessibilityLabel={t("feat.modalViewPreference.title")}
          onPress={() => artistsViewOptionsSheetRef.current?.present()}
          size="sm"
        />
      </SafeContainer>
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

//#region Utils
function formatData(
  item: ExtractQueryData<typeof useArtists>[number],
): LayoutItem {
  return {
    id: item.name,
    title: item.name,
    description: "10 Tracks", // FIXME: Temporary
    imageSource: item.artwork,
  };
}
//#endregion

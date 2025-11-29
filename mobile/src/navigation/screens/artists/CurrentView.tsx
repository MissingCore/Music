import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { Album } from "~/db/schema";

import { useArtistForScreen } from "~/queries/artist";
import { useGetColumn } from "~/hooks/useGetColumn";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useBottomActionsInset } from "../../hooks/useBottomActions";
import { CurrentListLayout } from "../../layouts/CurrentList";
import { ArtistArtworkSheet } from "../ArtworkSheet";

import { FlashList, LegendList } from "~/components/Defaults";
import { useSheetRef } from "~/components/Sheet";
import { TEm } from "~/components/Typography/StyledText";
import { MediaCard } from "~/modules/media/components/MediaCard";
import { useTrackListPreset } from "~/modules/media/components/Track";
import { CurrentListMenu } from "../../components/CurrentListMenu";
import {
  ContentPlaceholder,
  PagePlaceholder,
} from "../../components/Placeholder";
import { ScreenOptions } from "../../components/ScreenOptions";

type Props = StaticScreenProps<{ id: string }>;

type ArtistAlbum = Album & { releaseYear: string | null };

export default function Artist({
  route: {
    params: { id: artistName },
  },
}: Props) {
  const { t } = useTranslation();
  const bottomInset = useBottomActionsInset();
  const { isPending, error, data } = useArtistForScreen(artistName);
  const artworkSheetRef = useSheetRef();

  const trackSource = { type: "artist", id: artistName } as const;
  const presets = useTrackListPreset({ data: data?.tracks, trackSource });

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <CurrentListMenu
            name={data.name}
            trackIds={data.tracks.map(({ id }) => id)}
            presentArtworkSheet={() => artworkSheetRef.current?.present()}
          />
        )}
      />
      <CurrentListLayout
        title={data.name}
        metadata={data.metadata}
        imageSource={data.imageSource}
        mediaSource={trackSource}
      >
        <LegendList
          {...presets}
          ListHeaderComponent={<ArtistAlbums albums={data.albums} />}
          ListEmptyComponent={
            <ContentPlaceholder
              errMsg={t("feat.hiddenTracks.extra.hasHiddenTracks", {
                name: t("term.artist"),
              })}
            />
          }
          contentContainerClassName="px-4 pt-4"
          contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
        />
      </CurrentListLayout>

      <ArtistArtworkSheet sheetRef={artworkSheetRef} id={artistName} />
    </>
  );
}

/**
 * Display a list of the artist's albums. Renders a heading for the track
 * list only if the artist has albums.
 */
function ArtistAlbums({ albums }: { albums: ArtistAlbum[] | null }) {
  const navigation = useNavigation();
  const { width } = useGetColumn({
    cols: 1,
    gap: 0,
    gutters: 32,
    minWidth: 100,
  });
  const primaryFont = usePreferenceStore((s) => s.primaryFont);

  const estimatedListHeight = useMemo(
    () => width + (primaryFont === "Inter" ? 42 : 39),
    [primaryFont, width],
  );

  if (!albums) return null;
  return (
    <>
      <TEm dim textKey="term.albums" className="mb-2" />
      <FlashList
        horizontal
        data={albums}
        keyExtractor={({ id }) => id}
        renderItem={({ item, index }) => (
          <MediaCard
            type="album"
            id={item.id}
            size={width}
            source={item.artwork}
            title={item.name}
            description={item.releaseYear || "————"}
            onPress={() =>
              navigation.navigate("Album", { id: item.id }, { pop: true })
            }
            className={index > 0 ? "ml-3" : undefined}
          />
        )}
        style={{ minHeight: estimatedListHeight }}
        className="-mx-4"
        contentContainerClassName="px-4"
      />
      <TEm dim textKey="term.tracks" className="mb-2 mt-4" />
    </>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { db } from "~/db";

import { iAsc } from "~/lib/drizzle";
import { cn } from "~/lib/style";
import { FlatList } from "~/components/Defaults";
import { Divider } from "~/components/Divider";
import { StyledText } from "~/components/Typography/StyledText";
import { PagePlaceholder } from "../../components/Placeholder";

export default function MostPlayed() {
  const { isPending, error, data } = useMostPlayedTracks();

  if (isPending || error || data.length === 0) {
    return (
      <PagePlaceholder isPending={isPending} errMsgKey="err.msg.noResults" />
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={({ placement }) => `${placement}`}
      renderItem={({ item, index }) => (
        <View
          className={cn("flex-row rounded-sm bg-surface p-1", {
            "rounded-t-md": index === 0,
            "rounded-b-md": data.length - 1 === index,
          })}
        >
          <PlacementNumber placement={item.placement} />
          <PlayCountList tracks={item.tracks} />
        </View>
      )}
      contentContainerClassName="gap-[3px] p-4"
    />
  );
}

//#region List Components
function PlacementNumber({ placement }: { placement: number }) {
  return (
    <View className="size-12 items-center justify-center">
      <StyledText>{placement}</StyledText>
    </View>
  );
}

function PlayCountList({ tracks }: { tracks: TrackData[] }) {
  const { t } = useTranslation();
  return (
    <FlatList
      data={tracks}
      keyExtractor={({ id }) => id}
      renderItem={({ item: { name, artistName, playCount }, index }) => (
        <View className="gap-2">
          <View>
            <StyledText numberOfLines={1} className="text-sm">
              {name}
            </StyledText>
            <StyledText numberOfLines={1} dim>
              {artistName ?? "—"}
            </StyledText>
          </View>
          <Divider />
          {tracks.length - 1 === index ? (
            <StyledText numberOfLines={1} className="text-xs text-red">
              {t("feat.mostPlayed.extra.playCount", { count: playCount })}
            </StyledText>
          ) : null}
        </View>
      )}
      className="shrink grow gap-2 p-2 pr-3"
    />
  );
}
//#endregion

//#region Data Query
type TrackData = {
  id: string;
  name: string;
  playCount: number;
  artistName: string | null;
};

type MostPlayedPlacement = { placement: number; tracks: TrackData[] };

async function getMostPlayedTracks() {
  const mostPlayedTracks = await db.query.tracks.findMany({
    where: (fields, { gt }) => gt(fields.playCount, 0),
    columns: { id: true, name: true, artistName: true, playCount: true },
    orderBy: (fields, { desc }) => [desc(fields.playCount), iAsc(fields.name)],
    limit: 100,
  });

  const groupedPlacement: MostPlayedPlacement[] = [];
  let recentPlacement: MostPlayedPlacement | undefined;
  mostPlayedTracks.forEach((track) => {
    if (!recentPlacement) {
      recentPlacement = { placement: 1, tracks: [track] };
      return;
    }

    // If the current track belongs in the same placement.
    if (recentPlacement.tracks.at(-1)!.playCount === track.playCount) {
      recentPlacement.tracks.push(track);
      return;
    }

    // If this track is of a lower placement.
    groupedPlacement.push(recentPlacement);
    recentPlacement = {
      placement: recentPlacement.placement + recentPlacement.tracks.length,
      tracks: [track],
    };
  });

  // Push last placement.
  if (recentPlacement) groupedPlacement.push(recentPlacement);

  return groupedPlacement;
}

const queryKey = ["most-played"];

function useMostPlayedTracks() {
  return useQuery({
    queryKey,
    queryFn: getMostPlayedTracks,
    gcTime: 0,
    staleTime: 0,
  });
}
//#endregion

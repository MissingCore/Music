import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { eq } from "drizzle-orm";
import { Fragment, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { db } from "~/db";
import { tracksToLyrics } from "~/db/schema";

import { Add } from "~/resources/icons/Add";
import { Edit } from "~/resources/icons/Edit";
import { LinkOff } from "~/resources/icons/LinkOff";
import { queries as q } from "~/queries/keyStore";
import { useLyric } from "~/queries/lyric";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { queryClient } from "~/lib/react-query";
import { Divider } from "~/components/Divider";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { SegmentedList } from "~/components/List/Segmented";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";
import { LinkTracksSheet } from "./sheets/LinkTracksSheet";

type Props = StaticScreenProps<{ id: string }>;

export default function Lyric({
  route: {
    params: { id: lyricId },
  },
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, error, data } = useLyric(lyricId);
  const linkTracksSheetRef = useSheetRef();

  const linkedTracks = useMemo(() => {
    if (!data?.tracksToLyrics) return [];
    return data.tracksToLyrics
      .map(({ track }) => track)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data?.tracksToLyrics]);

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: q.lyrics._def });
    };
  }, []);

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;
  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <FilledIconButton
            Icon={Edit}
            accessibilityLabel={t("form.edit")}
            onPress={() => navigation.navigate("ModifyLyric", { id: lyricId })}
            size="sm"
          />
        )}
      />
      <LinkTracksSheet ref={linkTracksSheetRef} lyricId={lyricId} />

      <ListLayout>
        <SegmentedList.CustomItem className="p-4">
          <StyledText bold className="text-xl">
            {data.name}
          </StyledText>
        </SegmentedList.CustomItem>

        <SegmentedList>
          <SegmentedList.CustomItem className="min-h-12 flex-row items-center justify-between gap-2 pr-2 pl-4">
            <TStyledText textKey="term.tracks" className="shrink grow" />
            <IconButton
              Icon={Add}
              accessibilityLabel={t("template.entryAdd", {
                name: t("term.track"),
              })}
              onPress={() => linkTracksSheetRef.current?.present()}
              size="sm"
            />
          </SegmentedList.CustomItem>
          {linkedTracks.length > 0 ? (
            <SegmentedList.CustomItem>
              {linkedTracks.map(({ id, name, uri }, index) => (
                <Fragment key={id}>
                  {index > 0 ? <Divider className="mx-4" /> : null}
                  <SegmentedList.Item
                    labelText={name}
                    supportingText={uri}
                    RightElement={
                      <IconButton
                        Icon={LinkOff}
                        accessibilityLabel={t("template.entryRemove", { name })}
                        onPress={() => unlinkTrack({ trackId: id, lyricId })}
                      />
                    }
                    className="rounded-none pr-1"
                    _asView
                  />
                </Fragment>
              ))}
            </SegmentedList.CustomItem>
          ) : null}
        </SegmentedList>

        <SegmentedList.CustomItem className="p-4">
          <StyledText className="text-xs">{data.lyrics}</StyledText>
        </SegmentedList.CustomItem>
      </ListLayout>
    </>
  );
}

//#region Utils
async function unlinkTrack(entry: { trackId: string; lyricId: string }) {
  await db
    .delete(tracksToLyrics)
    .where(eq(tracksToLyrics.trackId, entry.trackId));

  queryClient.invalidateQueries({
    queryKey: q.lyrics.detail(entry.lyricId).queryKey,
  });
}
//#endregion

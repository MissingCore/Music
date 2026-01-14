import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Add } from "~/resources/icons/Add";
import { Edit } from "~/resources/icons/Edit";
import { LinkOff } from "~/resources/icons/LinkOff";
import { useLyric } from "~/queries/lyric";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { ScrollView } from "~/components/Defaults";
import { FilledIconButton, IconButton } from "~/components/Form/Button/Icon";
import { SegmentedList } from "~/components/List/Segmented";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { AccentText } from "~/components/Typography/AccentText";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";
import { LinkTracksSheet } from "./sheets/LinkTracksSheet";

type Props = StaticScreenProps<{ id: string }>;

export default function Lyric({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, error, data } = useLyric(id);
  const linkTracksSheetRef = useSheetRef();

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <FilledIconButton
            Icon={Edit}
            accessibilityLabel={t("form.edit")}
            onPress={() => navigation.navigate("ModifyLyric", { id })}
            size="sm"
          />
        )}
      />
      <LinkTracksSheet ref={linkTracksSheetRef} lyricId={id} />

      <ScrollView contentContainerClassName="grow gap-6 p-4">
        <SegmentedList.CustomItem className="p-4">
          <AccentText className="text-xl">{data.name}</AccentText>
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
          {data.tracksToLyrics.length > 0 ? (
            <SegmentedList.CustomItem>
              {data.tracksToLyrics.map(({ track }) => (
                <SegmentedList.Item
                  key={track.id}
                  labelText={track.name}
                  supportingText={track.uri}
                  RightElement={
                    <IconButton
                      Icon={LinkOff}
                      accessibilityLabel={t("template.entryRemove", {
                        name: track.name,
                      })}
                      onPress={() =>
                        console.log(`Unlinking ${track.name} from lyrics...`)
                      }
                    />
                  }
                  className="rounded-none"
                  _asView
                />
              ))}
            </SegmentedList.CustomItem>
          ) : null}
        </SegmentedList>

        <SegmentedList.CustomItem className="p-4">
          <StyledText className="text-xs">{data.lyrics}</StyledText>
        </SegmentedList.CustomItem>
      </ScrollView>
    </>
  );
}

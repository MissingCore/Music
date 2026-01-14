import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Add } from "~/resources/icons/Add";
import { Edit } from "~/resources/icons/Edit";
import { useLyrics } from "~/queries/lyric";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import type { ExtractQueryData } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { SegmentedList } from "~/components/List/Segmented";
import { SearchList } from "~/modules/search/components/SearchList";

type PartialLyric = ExtractQueryData<typeof useLyrics>[number];

export default function Lyrics() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, data } = useLyrics();

  if (isPending) return <PagePlaceholder isPending={isPending} />;
  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <FilledIconButton
            Icon={Add}
            accessibilityLabel={t("form.create")}
            onPress={() => navigation.navigate("CreateLyric")}
            size="sm"
          />
        )}
      />
      <SearchList
        data={data}
        keyExtractor={({ id }) => id}
        onFilterData={(_query, data) => {
          const query = _query.toLocaleLowerCase();

          const filteredResults = data.filter(({ name }) =>
            name.toLocaleLowerCase().includes(query),
          );

          // Have results that start with the query first.
          const goodMatch: PartialLyric[] = [];
          const partialMatch: PartialLyric[] = [];
          filteredResults.forEach((data) => {
            if (data.name.toLocaleLowerCase().startsWith(query))
              goodMatch.push(data);
            else partialMatch.push(data);
          });

          return goodMatch.concat(partialMatch);
        }}
        renderItem={({ item, index, listSize }) => (
          <SegmentedList.Item
            labelText={item.name}
            supportingText={t("plural.track", {
              count: item.tracksToLyrics.length,
            })}
            RightElement={<Edit />}
            onPress={() => navigation.navigate("Lyric", { id: item.id })}
            className={cn({
              "mt-0.75 rounded-t-xs": index > 0,
              "rounded-b-xs": index < listSize - 1,
            })}
          />
        )}
        wrapperClassName="px-4 pt-4"
        contentContainerClassName="pb-4"
      />
    </>
  );
}

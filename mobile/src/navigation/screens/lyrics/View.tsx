import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { db } from "~/db";

import { Add } from "~/resources/icons/Add";
import { Edit } from "~/resources/icons/Edit";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { cn } from "~/lib/style";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { SegmentedList } from "~/components/List/Segmented";
import { SearchList } from "~/modules/search/components/SearchList";

export default function Lyrics() {
  const { t } = useTranslation();
  const { isPending, data } = useLyrics();

  if (isPending) return <PagePlaceholder isPending={isPending} />;
  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <FilledIconButton
            Icon={Add}
            accessibilityLabel={t("form.create")}
            onPress={() =>
              console.log('Navigating to "Create Lyrics" screen...')
            }
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
            onPress={() =>
              console.log(`Navigating to lyrics screen for: ${item.id}`)
            }
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

//#region Data Query
type PartialLyric = { id: string; name: string; tracksToLyrics: any[] };

async function getLyrics() {
  return db.query.lyrics.findMany({
    columns: { lyrics: false },
    with: { tracksToLyrics: true },
    orderBy: (fields, { desc }) => desc(fields.name),
  });
}

const queryKey = ["lyrics"];

function useLyrics() {
  return useQuery({ queryKey, queryFn: getLyrics });
}
//#endregion

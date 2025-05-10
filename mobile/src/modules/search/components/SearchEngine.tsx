import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type {
  SlimAlbumWithTracks,
  SlimArtist,
  SlimPlaylistWithTracks,
  SlimTrackWithAlbum,
} from "~/db/slimTypes";
import { getPlaylistCover, getTrackCover } from "~/db/utils";

import { Close } from "~/icons/Close";
import { Search } from "~/icons/Search";
import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import { isString } from "~/utils/validation";
import { FlashList, SheetsFlashList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button";
import { TextInput, useInputRef } from "~/components/Form/Input";
import { ContentPlaceholder } from "~/components/Transition/Placeholder";
import { TEm } from "~/components/Typography/StyledText";
import { SearchResult } from "./SearchResult";
import { useSearch } from "../hooks/useSearch";
import type {
  SearchCallbacks,
  SearchCategories,
  SearchResults,
} from "../types";

/** All-in-one search - tracks the query and displays results. */
export function SearchEngine<TScope extends SearchCategories>(
  props: SearchResultsListProps<TScope>,
) {
  const { t } = useTranslation();
  const inputRef = useInputRef();
  const [query, setQuery] = useState("");

  return (
    <View className="shrink grow">
      {/* Search input. */}
      <View className="flex-row items-center gap-2 rounded-full bg-surface pl-4">
        <Search />
        <TextInput
          ref={inputRef}
          onChangeText={(text) => setQuery(text)}
          placeholder={t("feat.search.extra.searchMedia")}
          className="shrink grow"
        />
        <IconButton
          kind="ripple"
          accessibilityLabel={t("form.clear")}
          onPress={() => {
            inputRef?.current?.clear();
            setQuery("");
          }}
          disabled={query === ""}
          className="mr-1 disabled:invisible"
        >
          <Close />
        </IconButton>
      </View>
      <SearchResultsList {...props} query={query} />
    </View>
  );
}

type SearchResultsListProps<TScope extends SearchCategories> = {
  searchScope: TScope;
  callbacks: Pick<SearchCallbacks, TScope[number]>;
  bgColor?: string;
  withGesture?: boolean;
};

function SearchResultsList<TScope extends SearchCategories>(
  props: SearchResultsListProps<TScope> & { query: string },
) {
  const { canvas } = useTheme();
  const results = useSearch(props.searchScope, props.query);

  // Format results to be used in list.
  const data = useMemo(
    () => (results ? formatResults(results) : undefined),
    [results],
  );

  const shadowColor = useMemo(
    () => props.bgColor ?? canvas,
    [props.bgColor, canvas],
  );

  const ListComponent = useMemo(() => {
    return props.withGesture ? SheetsFlashList : FlashList;
  }, [props.withGesture]);

  return (
    <View className="relative shrink grow">
      <ListComponent
        estimatedItemSize={56} // 48px Height + 8px Margin Top
        data={data}
        // Note: We use `index` instead of the `id` or `name` field on the
        // `entry` due to there being potentially shared values (ie: between
        // artist & playlist names).
        keyExtractor={(item, index) => (isString(item) ? item : `${index}`)}
        getItemType={(item) => (isString(item) ? "label" : "row")}
        renderItem={({ item, index }) =>
          isString(item) ? (
            <TEm
              textKey={`term.${item}`}
              className={index > 0 ? "mt-4" : undefined}
            />
          ) : (
            <SearchResult
              as="ripple"
              /* @ts-expect-error - `type` should be limited to our scope. */
              onPress={() => props.callbacks[item.type](item.entry)}
              wrapperClassName={cn("mt-2", {
                "rounded-full": item.type === "artist",
              })}
              className="pr-4"
              {...item}
            />
          )
        }
        ListEmptyComponent={
          props.query.length > 0 ? (
            <ContentPlaceholder errMsgKey="err.msg.noResults" />
          ) : undefined
        }
        contentContainerClassName="pt-6 pb-4"
      />

      <LinearGradient
        colors={[`${shadowColor}FF`, `${shadowColor}00`]}
        start={{ x: 0.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        className="absolute left-0 top-0 h-6 w-full"
      />
    </View>
  );
}

//#region Helpers
/** Media items with an `artistName` field. */
const withArtistName = ["album", "track"];

/**
 * Flatten results to be used in a list that functions like a `<SectionList />`.
 * Ensure the "sections" are in alphabetical order and remove any groups with
 * no items before formatting.
 */
function formatResults(results: Partial<SearchResults>) {
  return Object.entries(results)
    .filter(([_, data]) => data.length > 0)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, data]) => [
      key as SearchCategories[number],
      ...data.map((item) => ({
        type: key as SearchCategories[number],
        // @ts-expect-error - Values are of correct types.
        imageSource: getArtwork({ type: key, data: item }),
        title: item.name,
        // prettier-ignore
        // @ts-expect-error - `artistName` should be present in these cases.
        description: withArtistName.includes(key) ? (item.artistName ?? "—") : undefined,
        entry: item,
      })),
    ])
    .flat();
}

type MediaRelations =
  | { type: "album"; data: SlimAlbumWithTracks }
  | { type: "artist"; data: SlimArtist }
  | { type: "playlist"; data: SlimPlaylistWithTracks }
  | { type: "track"; data: SlimTrackWithAlbum };

/** Get the artwork of the media that'll be displayed. */
function getArtwork({ type, data }: MediaRelations) {
  if (type === "album") return data.altArtwork ?? data.artwork;
  if (type === "artist") return data.artwork;
  if (type === "playlist") return getPlaylistCover(data);
  return getTrackCover(data);
}
//#endregion

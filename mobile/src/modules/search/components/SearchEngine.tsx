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

import { Close } from "~/resources/icons/Close";
import { Search } from "~/resources/icons/Search";
import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import { isString } from "~/utils/validation";
import { FlashList, FlatList, useFlashListRef } from "~/components/Defaults";
import { Button, IconButton } from "~/components/Form/Button";
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

type SearchTab = SearchCategories[number] | "all";

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
          autoFocus={!props.forSheets}
          onChangeText={(text) => setQuery(text)}
          placeholder={t("feat.search.extra.searchMedia")}
          className="shrink grow"
        />
        <IconButton
          Icon={Close}
          accessibilityLabel={t("form.clear")}
          onPress={() => {
            inputRef?.current?.clear();
            setQuery("");
          }}
          disabled={query === ""}
          className="mr-1 disabled:invisible"
        />
      </View>
      <SearchResultsList {...props} query={query} />
    </View>
  );
}

type SearchResultsListProps<TScope extends SearchCategories> = {
  searchScope: TScope;
  callbacks: Pick<SearchCallbacks, TScope[number]>;
  bgColor?: string;
  forSheets?: boolean;
};

function SearchResultsList<TScope extends SearchCategories>(
  props: SearchResultsListProps<TScope> & { query: string },
) {
  const { canvas } = useTheme();
  const listRef = useFlashListRef<ReturnType<typeof formatResults>>();
  const results = useSearch(props.searchScope, props.query);
  const [selectedTab, setSelectedTab] = useState<TScope[number] | "all">("all");
  const [filterHeight, setFilterHeight] = useState(53); // Height will be ~53px

  // Reset tab if we're on a tab with no results or clear the query.
  if (
    selectedTab !== "all" &&
    (results?.[selectedTab]?.length === 0 || props.query === "")
  ) {
    // Scroll to top of list when we change tabs.
    listRef.current?.scrollToOffset({ offset: 0 });
    setSelectedTab("all");
  }

  // Get the "tabs" we can filter the search results by.
  const tabsWithData = useMemo(() => {
    if (!results) return [];
    const availableTabs = Object.entries(results)
      .filter(([_, data]) => (data as unknown[]).length > 0)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key]) => key);
    return availableTabs.length > 0 ? ["all", ...availableTabs] : [];
  }, [results]) as Array<TScope[number] | "all">;

  // Format results to be used in list.
  const data = useMemo(
    () => (results ? formatResults(results, selectedTab) : undefined),
    [results, selectedTab],
  );

  const shadowColor = useMemo(
    () => props.bgColor ?? canvas,
    [props.bgColor, canvas],
  );

  return (
    <View className="relative shrink grow">
      <SearchFilters
        tabs={tabsWithData}
        selectedTab={selectedTab}
        onSelectTab={(tab) => {
          // Scroll to top of list when we change tabs.
          listRef.current?.scrollToOffset({ offset: 0 });
          setSelectedTab(tab);
        }}
        getHeight={setFilterHeight}
      />
      <FlashList
        // @ts-expect-error - Type conflicts with data.
        ref={listRef}
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
        nestedScrollEnabled={props.forSheets}
        contentContainerStyle={{
          paddingTop: tabsWithData.length > 0 ? filterHeight : 24,
        }}
        contentContainerClassName="pb-4"
      />

      <LinearGradient
        colors={[`${shadowColor}FF`, `${shadowColor}00`]}
        start={{ x: 0.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        style={{ height: filterHeight }}
        className="absolute left-0 top-0 w-full"
      />
    </View>
  );
}

/** Specify the type of content we want displayed. */
function SearchFilters(props: {
  tabs: SearchTab[];
  selectedTab: SearchTab;
  onSelectTab: (tab: SearchTab) => void;
  getHeight: (containerHeight: number) => void;
}) {
  if (props.tabs.length === 0) return null;
  return (
    <FlatList
      onLayout={(e) => props.getHeight(e.nativeEvent.layout.height)}
      horizontal
      data={props.tabs}
      renderItem={({ item: tab }) => {
        const selected = props.selectedTab === tab;
        return (
          <View className="rounded bg-canvas">
            <Button
              onPress={() => props.onSelectTab(tab)}
              className={cn("min-h-0 min-w-0 rounded px-3 py-1.5", {
                "bg-red": selected,
              })}
            >
              <TEm
                textKey={`term.${tab}`}
                className={cn("text-xs", { "text-neutral100": selected })}
                bold={false}
              />
            </Button>
          </View>
        );
      }}
      className="absolute left-0 top-0 z-10 -mx-4 py-3"
      contentContainerClassName="gap-1.5 px-4"
    />
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
function formatResults(results: Partial<SearchResults>, tab: SearchTab) {
  return Object.entries(results)
    .filter(([key, data]) => {
      if (tab !== "all" && tab !== key) return false;
      return data.length > 0;
    })
    .sort((a, b) => a[0].localeCompare(b[0]))
    .flatMap(([key, data]) => [
      ...(tab === "all" ? [key as SearchCategories[number]] : []),
      ...data.map((item) => {
        let description: string | undefined;
        // @ts-expect-error - `artistName` should be present in these cases.
        if (withArtistName.includes(key)) description = item.artistName ?? "—";
        // @ts-expect-error - `path` should be present in these cases.
        else if (item.path) description = item.path;

        return {
          type: key as SearchCategories[number],
          imageSource:
            // @ts-expect-error - Values are of correct types.
            key !== "folder" ? getArtwork({ type: key, data: item }) : null,
          title: item.name,
          description,
          entry: item,
        };
      }),
    ]);
}

type MediaRelations =
  | { type: "album"; data: SlimAlbumWithTracks }
  | { type: "artist"; data: SlimArtist }
  | { type: "playlist"; data: SlimPlaylistWithTracks }
  | { type: "track"; data: SlimTrackWithAlbum };

/** Get the artwork of the media that'll be displayed. */
function getArtwork({ type, data }: MediaRelations) {
  if (type === "album" || type === "artist") return data.artwork;
  if (type === "playlist") return getPlaylistCover(data);
  return getTrackCover(data);
}
//#endregion

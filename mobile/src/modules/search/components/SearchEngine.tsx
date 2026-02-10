import type { FlashListRef } from "@shopify/flash-list";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type {
  SlimAlbumWithTracks,
  SlimArtist,
  SlimPlaylistWithTracks,
  SlimTrackWithAlbum,
} from "~/db/slimTypes";

import { MoreVert } from "~/resources/icons/MoreVert";
import { AlbumArtistsKey } from "~/api/album.utils";
import { getArtistsString } from "~/api/artist.utils";
import { getPlaylistArtwork } from "~/api/playlist.utils";
import { getTrackArtwork } from "~/api/track.utils";
import { presentTrackSheet } from "~/services/SessionStore";

import type { ColorRole } from "~/lib/style";
import { cn } from "~/lib/style";
import { isString } from "~/utils/validation";
import { FlashList, FlatList } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { IconButton } from "~/components/Form/Button/Icon";
import { TopDownGradient } from "~/components/Gradient";
import { TEm } from "~/components/Typography/StyledText";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { SearchBar } from "./SearchBar";
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
  const [query, setQuery] = useState("");

  return (
    <View className="shrink grow">
      <SearchBar
        searchPlaceholder={t("feat.search.extra.searchMedia")}
        setQuery={setQuery}
        isEmpty={query === ""}
        autoFocus={!props.forSheets}
      />
      <SearchResultsList {...props} query={query} />
    </View>
  );
}

type SearchResultsListProps<TScope extends SearchCategories> = {
  searchScope: TScope;
  callbacks: Pick<SearchCallbacks, TScope[number]>;
  bgColor?: ColorRole;
  forSheets?: boolean;
  /** If we should render the track actions via the results. */
  withTrackActions?: boolean;
};

function SearchResultsList<TScope extends SearchCategories>(
  props: SearchResultsListProps<TScope> & { query: string },
) {
  const { t } = useTranslation();
  const results = useSearch(props.searchScope, props.query);
  const [selectedTab, setSelectedTab] = useState<TScope[number] | "all">("all");
  const [filterHeight, setFilterHeight] = useState(53); // Height will be ~53px
  const listRef = useRef<FlashListRef<ReturnType<typeof formatResults>>>(null);

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

  return (
    <View className="relative shrink grow">
      <SearchFilters
        tabs={tabsWithData}
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        getHeight={setFilterHeight}
      />
      <FlashList
        // @ts-expect-error - Arguments should be compatible.
        ref={listRef}
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
              className={cn("mb-2", { "mt-2": index > 0 })}
            />
          ) : (
            <SearchResult
              button
              {...item}
              /* @ts-expect-error - `type` should be limited to our scope. */
              onPress={() => props.callbacks[item.type](item.entry)}
              RightElement={
                props.withTrackActions && item.type === "track" ? (
                  <IconButton
                    Icon={MoreVert}
                    accessibilityLabel={t("template.entrySeeMore", {
                      name: item.title,
                    })}
                    onPress={() =>
                      presentTrackSheet((item.entry as SlimTrackWithAlbum).id)
                    }
                  />
                ) : undefined
              }
              className={cn("mb-2", {
                "pr-4": !props.withTrackActions || item.type !== "track",
                "rounded-full": item.type === "artist",
              })}
            />
          )
        }
        ListEmptyComponent={
          props.query.length > 0 ? (
            <ContentPlaceholder errMsgKey="err.msg.noResults" />
          ) : undefined
        }
        nestedScrollEnabled={props.forSheets}
        // FIXME: For some weird reason, we get double the margin bottom (should be `-mb-2`).
        className="-mb-1"
        contentContainerClassName="pb-4"
        contentContainerStyle={{
          paddingTop: tabsWithData.length > 0 ? filterHeight : 24,
        }}
      />

      <TopDownGradient
        height={filterHeight}
        color={props.bgColor}
        className="absolute top-0 left-0"
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
          <View className="rounded-sm bg-surface">
            <Button
              onPress={() => props.onSelectTab(tab)}
              className={cn("min-h-0 rounded-sm px-3 py-1.5", {
                "bg-primary active:bg-primaryDim": selected,
              })}
            >
              <TEm
                textKey={`term.${tab}`}
                className={cn("text-xs", { "text-onPrimary": selected })}
                bold={false}
              />
            </Button>
          </View>
        );
      }}
      className="absolute top-0 left-0 z-10 -mx-4 py-3"
      contentContainerClassName="gap-1.5 px-4"
    />
  );
}

//#region Helpers
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
        if (key === "album") {
          // @ts-expect-error - Album items have an `artistsKey` field.
          description = AlbumArtistsKey.toString(item.artistsKey);
        } else if (key === "track") {
          // @ts-expect-error - Tracks store their artists in this new field.
          description = getArtistsString(item.tracksToArtists);
        }
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
  if (type === "playlist") return getPlaylistArtwork(data);
  return getTrackArtwork(data);
}
//#endregion

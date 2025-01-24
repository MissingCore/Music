import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type {
  AlbumWithTracks,
  ArtistWithTracks,
  PlaylistWithTracks,
  TrackWithAlbum,
} from "~/db/schema";
import { getPlaylistCover, getTrackCover } from "~/db/utils";

import { Close } from "~/icons/Close";
import { Search } from "~/icons/Search";
import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import { FlashList, SheetsFlashList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button";
import { TextInput, useInputRef } from "~/components/Form/Input";
import { TEm, TStyledText } from "~/components/Typography/StyledText";
import { SearchResult } from "./SearchResult";
import { useSearch } from "../hooks/useSearch";
import type {
  SearchCallbacks,
  SearchCategories,
  SearchResults,
} from "../types";

/** All-in-one search - tracks the query and displays results. */
export function SearchEngine<TScope extends SearchCategories>(props: {
  searchScope: TScope;
  callbacks: Pick<SearchCallbacks, TScope[number]>;
  bgColor?: string;
  withGesture?: boolean;
}) {
  const { t } = useTranslation();
  const { canvas } = useTheme();
  const inputRef = useInputRef();
  const [query, setQuery] = useState("");
  const results = useSearch(props.searchScope, query);

  // Format results to be used in `<FlashList />`.
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
    <View className="grow">
      {/* Search input. */}
      <View className="flex-row items-center gap-2 rounded-full bg-surface pl-4">
        <Search />
        <TextInput
          ref={inputRef}
          onChangeText={(text) => setQuery(text)}
          placeholder={t("form.placeholder.searchMedia")}
          className="shrink grow"
        />
        <IconButton
          kind="ripple"
          accessibilityLabel={t("template.entryRemove", { name: query })}
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
      {/* Results list w/ scroll shadow. */}
      <View className="relative grow">
        <ListComponent
          estimatedItemSize={56} // 48px Height + 8px Margin Top
          data={data}
          keyExtractor={(_, index) => `${index}`}
          renderItem={({ item, index }) => {
            if (typeof item === "string") {
              return (
                <TEm
                  textKey={`common.${item}`}
                  className={index > 0 ? "mt-4" : undefined}
                />
              );
            }
            const { entry, ...rest } = item;

            return (
              <SearchResult
                as="ripple"
                /* @ts-expect-error - `type` should be limited to our scope. */
                onPress={() => props.callbacks[rest.type](entry)}
                wrapperClassName={cn("mt-2", {
                  "rounded-full": rest.type === "artist",
                })}
                className="pr-4"
                {...rest}
              />
            );
          }}
          ListEmptyComponent={
            query.length > 0 ? (
              <TStyledText textKey="response.noResults" center />
            ) : undefined
          }
          contentContainerClassName="pb-4 pt-6"
        />

        <LinearGradient
          colors={[`${shadowColor}FF`, `${shadowColor}00`]}
          start={{ x: 0.0, y: 0.0 }}
          end={{ x: 0.0, y: 1.0 }}
          className="absolute left-0 top-0 h-6 w-full"
        />
      </View>
    </View>
  );
}

//#region Helpers
/** Media items with an `artistName` field. */
const withArtistName = ["album", "track"];

/**
 * Flatten results to be used in a `<FlashList />` that functions like a
 * `<SectionList />`. Ensure the "sections" are in alphabetical order and
 * remove any groups with no items before formatting.
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
  | { type: "album"; data: AlbumWithTracks }
  | { type: "artist"; data: ArtistWithTracks }
  | { type: "playlist"; data: PlaylistWithTracks }
  | { type: "track"; data: TrackWithAlbum };

/** Get the artwork of the media that'll be displayed. */
function getArtwork(props: MediaRelations) {
  if (props.type === "album") return props.data.artwork;
  if (props.type === "artist") return props.data.artwork;
  if (props.type === "playlist") return getPlaylistCover(props.data);
  return getTrackCover(props.data);
}
//#endregion

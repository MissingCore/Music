import { useNavigation } from "@react-navigation/native";

import { useArtists } from "~/queries/artist";
import { StickyActionListLayout } from "../../layouts/StickyActionScroll";

import { cn } from "~/lib/style";
import { SearchResult } from "~/modules/search/components/SearchResult";
import { ContentPlaceholder } from "../../components/Placeholder";

export default function Artists() {
  const navigation = useNavigation();
  const { isPending, data } = useArtists();

  return (
    <StickyActionListLayout
      titleKey="term.artists"
      estimatedItemSize={56} // 48px Height + 8px Margin Top
      data={data}
      keyExtractor={({ name }) => name}
      renderItem={({ item, index }) => (
        <SearchResult
          as="ripple"
          type="artist"
          title={item.name}
          imageSource={item.artwork}
          onPress={() => navigation.navigate("Artist", { id: item.name })}
          wrapperClassName={cn("rounded-full", { "mt-2": index > 0 })}
          className="pr-4"
        />
      )}
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending}
          errMsgKey="err.msg.noArtists"
        />
      }
    />
  );
}

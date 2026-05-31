import { Edit } from "~/resources/icons/Edit";

import { useLyricStore } from "../core/store";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { LegendList } from "~/components/Base/LegendList";
import { ListItem } from "~/components/List";

export default function LyricsProviders() {
  const lyricProviders = useLyricStore((s) => s.providers);
  return (
    <LegendList
      data={lyricProviders}
      keyExtractor={({ id }) => id}
      renderItem={({ item }) => (
        <ListItem
          labelText={item.name}
          supportingText={item.endpoint}
          RightElement={<Edit />}
          onPress={() =>
            console.log(`Editing "${item.name}" lyric provider...`)
          }
          className="mb-0.75"
        />
      )}
      ListEmptyComponent={<ContentPlaceholder errMsgKey="err.msg.noContent" />}
      contentContainerClassName="p-4"
    />
  );
}

import { useSaveErrors } from "~/queries/setting";

import { useListPresets } from "~/components/Containment/List";
import { FlashList } from "~/components/Defaults";
import { ContentPlaceholder } from "../../components/Placeholder";

export default function SaveErrors() {
  const { data } = useSaveErrors();
  const presets = useListPresets({
    data,
    renderOptions: {
      getTitle: (item) => item.uri,
      getDescription: (item) => `[${item.errorName}] ${item.errorMessage}`,
    },
  });

  return (
    <FlashList
      keyExtractor={({ id }) => id}
      ListEmptyComponent={<ContentPlaceholder errMsgKey="err.msg.noErrors" />}
      contentContainerClassName="p-4"
      {...presets}
    />
  );
}

import { useSaveErrors } from "~/queries/setting";

import { useListPresets } from "~/components/Containment/List";
import { LegendList } from "~/components/Defaults";
import { ContentPlaceholder } from "~/components/Transition/Placeholder";

/** Screen for `/setting/insights/save-errors` route. */
export default function SaveErrorsScreen() {
  const { data } = useSaveErrors();
  const presets = useListPresets({
    data,
    renderOptions: {
      getTitle: (item) => item.uri,
      getDescription: (item) => `[${item.errorName}] ${item.errorMessage}`,
    },
  });

  return (
    <LegendList
      keyExtractor={({ id }) => id}
      ListEmptyComponent={<ContentPlaceholder errMsgKey="err.msg.noErrors" />}
      contentContainerClassName="p-4"
      {...presets}
    />
  );
}

import { useSaveErrors } from "~/queries/setting";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { ListRenderer } from "~/components/Containment/List";

/** Screen for `/setting/insights/save-errors` route. */
export default function SaveErrorsScreen() {
  const { data } = useSaveErrors();
  return (
    <StandardScrollLayout>
      <ListRenderer
        data={data}
        keyExtractor={({ id }) => id}
        renderOptions={{
          getTitle: (item) => item.uri,
          getDescription: (item) => `[${item.errorName}] ${item.errorMessage}`,
        }}
        emptyMsgKey="err.msg.noErrors"
      />
    </StandardScrollLayout>
  );
}

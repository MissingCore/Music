import { useTranslation } from "react-i18next";

import { useSaveErrors } from "@/queries/setting";
import { StandardScrollLayout } from "@/layouts";

import { ListRenderer } from "@/components/Containment";
import { StyledText } from "@/components/Typography";

/** Screen for `/setting/insights/save-errors` route. */
export default function SaveErrorsScreen() {
  const { t } = useTranslation();
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
        ListEmptyComponent={
          <StyledText center>{t("response.noErrors")}</StyledText>
        }
      />
    </StandardScrollLayout>
  );
}

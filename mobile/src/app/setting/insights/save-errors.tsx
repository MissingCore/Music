import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { db } from "@/db";
import { settingKeys } from "@/constants/QueryKeys";

import { SettingsLayout } from "@/layouts/SettingsLayout";

import { ListRenderer } from "@/components/new/List";
import { StyledText } from "@/components/new/Typography";

/** Screen for `/setting/insights/save-errors` route. */
export default function SaveErrorsScreen() {
  const { t } = useTranslation();
  const { data } = useSaveErrors();

  return (
    <SettingsLayout>
      <ListRenderer
        data={data}
        keyExtractor={({ id }) => id}
        renderOptions={{
          getTitle: (item) => item.uri,
          getDescription: (item) => `[${item.errorName}] ${item.errorMessage}`,
        }}
        ListEmptyComponent={
          <StyledText className="text-center">
            {t("response.noErrors")}
          </StyledText>
        }
      />
    </SettingsLayout>
  );
}

//#region Data
async function getSaveErrors() {
  return db.query.invalidTracks.findMany();
}

const useSaveErrors = () =>
  useQuery({
    queryKey: settingKeys.storageRelation("save-errors"),
    queryFn: getSaveErrors,
    gcTime: 0,
  });
//#endregion

import { useQuery } from "@tanstack/react-query";

import { db } from "~/db";

import { useListPresets } from "~/components/Containment/List";
import { LegendList } from "~/components/Defaults";
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
    <LegendList
      keyExtractor={({ id }) => id}
      ListEmptyComponent={<ContentPlaceholder errMsgKey="err.msg.noErrors" />}
      contentContainerClassName="p-4"
      {...presets}
    />
  );
}

//#region Data Query
async function getSaveErrors() {
  return db.query.invalidTracks.findMany();
}

const queryKey = ["settings", "save-errors"];

function useSaveErrors() {
  return useQuery({ queryKey, queryFn: getSaveErrors, staleTime: 0 });
}
//#endregion

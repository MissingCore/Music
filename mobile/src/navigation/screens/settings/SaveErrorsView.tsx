// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";

import { db } from "~/db";

import { FlatList } from "~/components/Base/List";
import { useGeneratedSegmentedList } from "~/components/List/Segmented";
import { ContentPlaceholder } from "../../components/Placeholder";

export default function SaveErrors() {
  const { data } = useSaveErrors();
  const listContext = useGeneratedSegmentedList({
    data,
    renderOptions: {
      getLabel: (item) => item.uri,
      getSupportingText: (item) => `[${item.errorName}] ${item.errorMessage}`,
    },
  });

  return (
    <FlatList
      keyExtractor={({ id }) => id}
      ListEmptyComponent={<ContentPlaceholder errMsgKey="err.msg.noErrors" />}
      contentContainerClassName="p-4"
      {...listContext}
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

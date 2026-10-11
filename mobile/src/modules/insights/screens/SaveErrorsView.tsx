// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";

import { db } from "~/db";

import { ScrollLayoutTitle } from "~/navigation/layouts/ScrollLayout";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { cn } from "~/lib/style";
import { LegendList } from "~/components/Base/LegendList";
import { TextStack } from "~/components/next/blocks/text-stack";
import { ToolbarScreenOffset } from "~/components/next/composed/toolbar";

export default function SaveErrors() {
  const { data } = useSaveErrors();
  return (
    <LegendList
      data={data}
      keyExtractor={({ id }) => id}
      renderItem={({ item, index }) => (
        <View
          className={cn("rounded-xl bg-surfaceContainerLowest p-4", {
            "rounded-t-xs": index > 0,
            "rounded-b-xs": index < (data?.length ?? 0) - 1,
          })}
        >
          <TextStack
            label={item.uri}
            supporting={`[${item.errorName}] ${item.errorMessage}`}
          />
        </View>
      )}
      ListHeaderComponent={
        <ScrollLayoutTitle title="feat.saveErrors.title" className="mb-5.25" />
      }
      ListEmptyComponent={<ContentPlaceholder errMsgKey="err.msg.noErrors" />}
      contentContainerClassName={cn("gap-0.75 p-4", ToolbarScreenOffset)}
    />
  );
}

//#region Data Query
async function getSaveErrors() {
  return db.query.invalidTracks.findMany();
}

const queryKey = ["insights", "save-errors"];

function useSaveErrors() {
  return useQuery({ queryKey, queryFn: getSaveErrors, staleTime: 0 });
}
//#endregion

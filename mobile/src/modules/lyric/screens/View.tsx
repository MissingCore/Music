// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Icon } from "~/resources/icons";
import { useLyrics } from "~/data/lyric/queries";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { cn } from "~/lib/style";
import { SegmentedList } from "~/components/List/Segmented";
import { IconButton } from "~/components/next/base/button-icon";
import { Search } from "~/modules/search/components/SearchList";
import { containSorter } from "~/modules/search/utils";

type Props = StaticScreenProps<{ linkTo?: string }>;

export default function Lyrics({
  route: {
    params: { linkTo },
  },
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, data } = useLyrics();

  if (isPending) return <PagePlaceholder isPending={isPending} />;
  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <IconButton
            icon="add"
            accessibilityLabel={t("form.create")}
            onPress={() => {
              // Clear `linkTo` param as it should get "used".
              if (linkTo) navigation.setParams({ linkTo: undefined });
              navigation.navigate("CreateLyric", { linkTo });
            }}
            filled
          />
        )}
      />
      <Search.Provider>
        <View className="shrink grow px-4 pt-4">
          <Search.Input />
          <Search.List
            estimatedItemSize={73} // ~70px Min Height + 3px Top Margin
            data={data}
            keyExtractor={({ id }) => id}
            onFilterData={(query, data) => containSorter(data, query, "name")}
            renderItem={({ item, index, listSize }) => (
              <SegmentedList.Item
                labelText={item.name}
                supportingText={t("plural.track", { count: item.trackCount })}
                Trailing={<Icon name="edit" />}
                onPress={() => navigation.navigate("Lyric", { id: item.id })}
                className={cn({
                  "mt-0.75 rounded-t-xs": index > 0,
                  "rounded-b-xs": index < listSize - 1,
                })}
              />
            )}
            emptyMsgKey="err.msg.noLyrics"
            contentContainerClassName="pb-safe-offset-4"
          />
        </View>
      </Search.Provider>
    </>
  );
}

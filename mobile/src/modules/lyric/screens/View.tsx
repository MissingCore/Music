// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Icon } from "~/resources/icons";
import { useLyrics } from "~/data/lyric/queries";

import { PagePlaceholder } from "~/navigation/components/Placeholder";
import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { cn } from "~/lib/style";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { SegmentedList } from "~/components/List/Segmented";
import { SearchList } from "~/modules/search/components/SearchList";
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
          <FilledIconButton
            icon="add"
            accessibilityLabel={t("form.create")}
            onPress={() => {
              // Clear `linkTo` param as it should get "used".
              if (linkTo) navigation.setParams({ linkTo: undefined });
              navigation.navigate("CreateLyric", { linkTo });
            }}
          />
        )}
      />
      <SearchList
        data={data}
        keyExtractor={({ id }) => id}
        onFilterData={(query, data) => containSorter(data, query, "name")}
        renderItem={({ item, index, listSize }) => (
          <SegmentedList.Item
            labelText={item.name}
            supportingText={t("plural.track", { count: item.trackCount })}
            RightElement={<Icon name="edit" />}
            onPress={() => navigation.navigate("Lyric", { id: item.id })}
            className={cn({
              "mt-0.75 rounded-t-xs": index > 0,
              "rounded-b-xs": index < listSize - 1,
            })}
          />
        )}
        emptyMsgKey="err.msg.noLyrics"
        wrapperClassName="px-4 pt-4"
        contentContainerClassName="pb-4"
      />
    </>
  );
}

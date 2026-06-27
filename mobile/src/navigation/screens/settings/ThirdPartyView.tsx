// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";

import LicensesList from "~/resources/licenses.json";

import { FlatList } from "~/components/Base/List";
import { useGeneratedSegmentedList } from "~/components/List/Segmented";

export default function ThirdParty() {
  const navigation = useNavigation();
  const listContext = useGeneratedSegmentedList({
    data: Object.entries(LicensesList),
    renderOptions: {
      getLabel: ([_, item]) => item.name,
      getSupportingText: ([_, item]) => `${item.license} (${item.version})`,
      onPress:
        ([id]) =>
        () =>
          navigation.navigate("PackageLicense", { id }),
    },
  });

  return (
    <FlatList
      keyExtractor={([id]) => id}
      contentContainerClassName="p-4"
      {...listContext}
    />
  );
}

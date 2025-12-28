import { useNavigation } from "@react-navigation/native";

import LicensesList from "~/resources/licenses.json";

import { LegendList } from "~/components/Defaults";
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
    <LegendList
      keyExtractor={([id]) => id}
      contentContainerClassName="p-4"
      {...listContext}
    />
  );
}

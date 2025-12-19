import { useNavigation } from "@react-navigation/native";

import LicensesList from "~/resources/licenses.json";

import { useListPresets } from "~/components/Containment/List";
import { LegendList } from "~/components/Defaults";

export default function ThirdParty() {
  const navigation = useNavigation();
  const presets = useListPresets({
    data: Object.entries(LicensesList),
    renderOptions: {
      getTitle: ([_, item]) => item.name,
      getDescription: ([_, item]) => `${item.license} (${item.version})`,
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
      {...presets}
    />
  );
}

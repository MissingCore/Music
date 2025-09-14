import { router } from "expo-router";

import LicensesList from "~/resources/licenses.json";

import { useListPresets } from "~/components/Containment/List";
import { FlashList } from "~/components/Defaults";

export default function ThirdParty() {
  const presets = useListPresets({
    data: Object.entries(LicensesList),
    renderOptions: {
      getTitle: ([_, item]) => item.name,
      getDescription: ([_, item]) => `${item.license} (${item.version})`,
      onPress:
        ([id]) =>
        () =>
          router.navigate(`/setting/third-party/${encodeURIComponent(id)}`),
    },
  });
  return (
    <FlashList
      keyExtractor={([id]) => id}
      contentContainerClassName="p-4"
      {...presets}
    />
  );
}

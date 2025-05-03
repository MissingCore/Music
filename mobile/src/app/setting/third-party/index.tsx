import { router } from "expo-router";

import LicensesList from "~/resources/licenses.json";

import { useListPresets } from "~/components/Containment/List";
import { FlashList } from "~/components/Defaults";

/** Screen for `/setting/third-party` route. */
export default function ThirdPartyScreen() {
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
      className="mx-4"
      contentContainerClassName="p-4"
      {...presets}
    />
  );
}

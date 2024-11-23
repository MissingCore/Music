import { router } from "expo-router";

import LicensesList from "@/resources/licenses.json";
import { StandardScrollLayout } from "@/layouts";

import { ListRenderer } from "@/components/Containment";

/** Screen for `/setting/third-party` route. */
export default function ThirdPartyScreen() {
  const LicenseData = Object.values(LicensesList);
  return (
    <StandardScrollLayout>
      <ListRenderer
        data={LicenseData}
        keyExtractor={({ name }) => name}
        renderOptions={{
          getTitle: (item) => item.name,
          getDescription: (item) => `${item.license} (${item.version})`,
          onPress: (item) => () =>
            router.navigate(
              `/setting/third-party/${encodeURIComponent(item.name)}`,
            ),
        }}
      />
    </StandardScrollLayout>
  );
}

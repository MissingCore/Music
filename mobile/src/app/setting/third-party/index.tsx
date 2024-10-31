import { router } from "expo-router";

import LicensesList from "@/resources/licenses.json";
import { SettingsLayout } from "@/layouts/SettingsLayout";

import { ListRenderer } from "@/components/new/Containment";

/** Screen for `/setting/third-party` route. */
export default function ThirdPartyScreen() {
  const LicenseData = Object.values(LicensesList);

  return (
    <SettingsLayout>
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
    </SettingsLayout>
  );
}

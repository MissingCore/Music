import { router } from "expo-router";

import LicensesList from "@/resources/licenses.json";
import { StandardScrollLayout } from "@/layouts";

import { ListRenderer } from "@/components/Containment";

/** Screen for `/setting/third-party` route. */
export default function ThirdPartyScreen() {
  return (
    <StandardScrollLayout>
      <ListRenderer
        data={Object.entries(LicensesList)}
        keyExtractor={([id]) => id}
        renderOptions={{
          getTitle: ([_, item]) => item.name,
          getDescription: ([_, item]) => `${item.license} (${item.version})`,
          onPress:
            ([id]) =>
            () =>
              router.navigate(`/setting/third-party/${encodeURIComponent(id)}`),
        }}
      />
    </StandardScrollLayout>
  );
}

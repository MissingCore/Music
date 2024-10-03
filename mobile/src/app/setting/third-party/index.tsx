import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";

import LicensesList from "@/resources/licenses.json";
import { SettingsLayout } from "@/layouts/SettingsLayout";

import { cn } from "@/lib/style";
import { ListItem } from "@/components/new/List";

/** Screen for `/setting/third-party` route. */
export default function ThirdPartyScreen() {
  const LicenseData = Object.values(LicensesList);

  return (
    <SettingsLayout>
      <FlashList
        estimatedItemSize={70}
        data={LicenseData}
        keyExtractor={({ name }) => name}
        renderItem={({ item, index }) => {
          const first = index === 0;
          const last = index === LicenseData.length - 1;
          return (
            <ListItem
              title={item.name}
              description={`${item.license} (${item.version})`}
              onPress={() =>
                router.navigate(
                  `/setting/third-party/${encodeURIComponent(item.name)}`,
                )
              }
              {...{ first, last }}
              className={cn({ "mb-[3px]": !last })}
            />
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </SettingsLayout>
  );
}

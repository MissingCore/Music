import { ScrollView } from "react-native";

/** Container for content on the setting pages. */
export function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="grow gap-6 p-4"
    >
      {children}
    </ScrollView>
  );
}

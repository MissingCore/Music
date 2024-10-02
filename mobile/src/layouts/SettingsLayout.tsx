import { ScrollView } from "react-native";

/** Container for content on the setting pages. */
export function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView contentContainerClassName="gap-6 p-4 pb-8">
      {children}
    </ScrollView>
  );
}

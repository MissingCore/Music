import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import LicensesList from "@/assets/licenses.json";

import { AnimatedHeader } from "@/components/navigation/animated-header";
import { Back } from "@/components/navigation/back";
import { NavLink } from "@/components/navigation/nav-link";
import { Description } from "@/components/ui/text";

/** @description Screen for `/setting/licenses/[...id]` route. */
export default function CurrentLicenseScreen() {
  const { id } = useLocalSearchParams<{ id: string[] }>();

  const licenseInfo = LicensesList[id!.join("/") as keyof typeof LicensesList];

  if (!licenseInfo) return <Back />;

  return (
    <AnimatedHeader title={licenseInfo.name}>
      <Description intent="setting" className="mb-8">
        <Text className="text-foreground100">{licenseInfo.version}</Text>
        {"\n\n"}
        This component is licensed under the {licenseInfo.license} license.
        {!!licenseInfo.copyright && (
          <>
            {"\n\n"}
            <Text className="italic">{licenseInfo.copyright}</Text>
          </>
        )}
      </Description>

      <NavLink
        href={licenseInfo.source}
        iconName={
          licenseInfo.source.startsWith("https://github.com")
            ? "logo-github"
            : "globe-outline"
        }
        label="Source"
        external
      />

      <View className="mb-6 border-t border-surface700" />

      <Description intent="setting">{licenseInfo.licenseText}</Description>
    </AnimatedHeader>
  );
}

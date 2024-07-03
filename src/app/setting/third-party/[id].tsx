import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import LicensesList from "@/assets/licenses.json";

import { AnimatedHeader } from "@/components/navigation/animated-header";
import { Back } from "@/components/navigation/back";
import { NavLink } from "@/components/navigation/nav-link";
import { Description } from "@/components/ui/text";

/** @description Screen for `/setting/third-party/[id]` route. */
export default function PackageLicenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const licenseInfo = LicensesList[id! as keyof typeof LicensesList];

  if (!licenseInfo) return <Back />;

  return (
    <AnimatedHeader title={licenseInfo.name}>
      <Description intent="setting" className="mb-6">
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

      <View className="-mx-4">
        <NavLink href={licenseInfo.source} label="Source" external />
      </View>

      <View className="mb-6 mt-2 h-px bg-surface850" />

      <Description intent="setting">{licenseInfo.licenseText}</Description>
    </AnimatedHeader>
  );
}

import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import LicensesList from "@/assets/licenses.json";

import { AnimatedHeader } from "@/components/navigation/AnimatedHeader";
import { Back } from "@/components/navigation/Back";
import { Description, Link } from "@/features/setting/components/UI";

/** @description Screen for `/setting/licenses/[...id]` route. */
export default function CurrentLicenseScreen() {
  const { id } = useLocalSearchParams<{ id: string[] }>();

  const licenseInfo = LicensesList[id!.join("/") as keyof typeof LicensesList];

  if (!licenseInfo) return <Back />;

  return (
    <AnimatedHeader title={licenseInfo.name}>
      <Description className="mb-8">
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

      <Link
        href={licenseInfo.source}
        iconName={
          licenseInfo.source.startsWith("https://github.com")
            ? "logo-github"
            : "globe-outline"
        }
        label="Source"
      />

      <View className="mb-6 border-t border-surface700" />

      <Description>{licenseInfo.licenseText}</Description>
    </AnimatedHeader>
  );
}

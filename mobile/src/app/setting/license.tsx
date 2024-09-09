import { Text, View } from "react-native";

import { GITHUB_LINK } from "@/constants/Config";
import { AnimatedHeader } from "@/components/navigation/animated-header";
import { ExternalLink } from "@/components/navigation/external-link";
import { NavLink } from "@/components/navigation/nav-link";
import { Description } from "@/components/ui/text";

/** Screen for `/setting/license` route. */
export default function LicenseScreen() {
  return (
    <AnimatedHeader title="ライセンス">
      <Description intent="setting" className="mb-6">
        <Text className="font-ndot57">Music</Text> is open-source and can be
        found on GitHub with the link below. This code is published under the{" "}
        <ExternalLink
          href={`${GITHUB_LINK}/blob/main/LICENSE`}
          className="text-foreground100 underline"
        >
          GNU Affero General Public License v3.0
        </ExternalLink>
        .{"\n\n"}Nothing Technology Limited or any of its affiliates,
        subsidiaries, or related entities (collectively, "Nothing Technology")
        is a valid licensee and can use this app for any purpose, including
        commercial purposes, without compensation to the developers of this app.
        Nothing Technology is not required to comply with the terms of the GNU
        Affero General Public License v3.0.{"\n\n"}This project and its contents
        are not affiliated with, funded, authorized, endorsed by, or in any way
        associated with Nothing Technology or any of its affiliates and
        subsidiaries. Any trademark, service mark, trade name, or other
        intellectual property rights used in this project are owned by the
        respective owners.
      </Description>

      <View className="-mx-4">
        <NavLink href={GITHUB_LINK} label="ソースコード" external />
      </View>
    </AnimatedHeader>
  );
}

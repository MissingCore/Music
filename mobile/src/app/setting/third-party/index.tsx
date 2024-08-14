import { FlashList } from "@shopify/flash-list";
import { Link } from "expo-router";
import { Text, View } from "react-native";

import LicensesList from "@/resources/licenses.json";
import { ArrowRight } from "@/resources/svgs/ArrowRight";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";
import { AnimatedHeader } from "@/components/navigation/animated-header";
import { NavLinkLabel } from "@/components/navigation/nav-link";
import { StyledPressable } from "@/components/ui/pressable";
import { Description } from "@/components/ui/text";

/** Screen for `/setting/third-party` route. */
export default function ThirdPartyScreen() {
  return (
    <AnimatedHeader title="THIRD-PARTY SOFTWARE">
      <Description intent="setting" className="mb-6">
        This project couldn't have been made without the help of the
        open-sourced projects listed below.
      </Description>

      <View className="-mx-4 flex-1">
        <FlashList
          estimatedItemSize={52} // 48px Min-Height + 4px Margin Bottom
          data={Object.values(LicensesList)}
          keyExtractor={({ name }) => name}
          renderItem={({ item, index }) => (
            <Link
              href={`/setting/third-party/${encodeURIComponent(item.name)}`}
              asChild
            >
              <StyledPressable
                className={cn(
                  "flex-row items-center justify-between gap-2 pl-4",
                  { "mb-1": index !== Object.values(LicensesList).length - 1 },
                )}
              >
                <View className="shrink py-1">
                  <NavLinkLabel className="tracking-normal">
                    {item.name}
                  </NavLinkLabel>
                  <Text className="shrink font-geistMonoLight text-xs text-foreground100">
                    {item.license}{" "}
                    <Text className="text-surface400">({item.version})</Text>
                  </Text>
                </View>
                <View className="p-3">
                  <ArrowRight size={24} color={Colors.surface400} />
                </View>
              </StyledPressable>
            </Link>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </AnimatedHeader>
  );
}

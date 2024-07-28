import { Link, Stack } from "expo-router";
import { atom, useAtomValue } from "jotai";
import { ScopeProvider } from "jotai-scope";
import { Fragment, useEffect, useRef } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInLeft, FadeOutRight } from "react-native-reanimated";

import { cn } from "@/lib/style";
import { ScrollRow } from "@/components/ui/container";
import { ScrollShadow } from "@/components/ui/scroll-shadow";

/**
 * FIXME: Need to use atom to get the current layout path since although
 * `useLocalSearchParams()` re-renders in this `_layout.tsx` file when
 * navigating between `[...id]` routes, the value doesn't change.
 *
 * With this solution, we also encouter a problem with the value persisting
 * after the screen is popped off the stack (which makes sense). To reset
 * after being popped, we use `jotai-scope`.
 */
export const folderPathAtom = atom<string[]>([]);

export default function FolderLayout() {
  return (
    <ScopeProvider atoms={[folderPathAtom]}>
      <View>
        <Breadcrumbs />
        <ScrollShadow size={16} />
      </View>
      <Stack screenOptions={{ animation: "fade", headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[...id]" />
      </Stack>
    </ScopeProvider>
  );
}

/** Custom folder structure breadcrumbs. */
function Breadcrumbs() {
  const pathSegments = useAtomValue(folderPathAtom);
  const breadcrumbsRef = useRef<ScrollRow.Ref>(null);

  useEffect(() => {
    if (breadcrumbsRef.current) breadcrumbsRef.current.scrollToEnd();
  }, [pathSegments]);

  return (
    <ScrollRow ref={breadcrumbsRef} className="pb-2">
      {pathSegments.map((dirName, idx) => (
        <Fragment key={idx}>
          {idx !== 0 && (
            <Text className="px-1 font-geistMono text-sm text-foreground50">
              /
            </Text>
          )}
          <Animated.View entering={FadeInLeft} exiting={FadeOutRight}>
            <Link
              href={`/folder/${pathSegments
                .slice(0, idx + 1)
                .map((segment) => encodeURIComponent(segment))
                .join("/")}`}
              disabled={idx === pathSegments.length - 1}
              className={cn(
                "font-geistMono text-sm text-foreground50 active:opacity-75",
                { "text-accent50": idx === pathSegments.length - 1 },
              )}
            >
              {dirName}
            </Link>
          </Animated.View>
        </Fragment>
      ))}
    </ScrollRow>
  );
}

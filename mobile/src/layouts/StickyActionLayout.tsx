import { View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBottomActionsLayout } from "@/hooks/useBottomActionsLayout";

import { cn } from "@/lib/style";
import { AccentText } from "@/components/new/Typography";

//#region Layout
/** Full-screen layout for displaying content on pages without a header bar. */
export function StickyActionLayout({
  title,
  StickyAction,
  children,
  wrapperClassName,
  withoutHeaderBar = true,
}: {
  title: string;
  StickyAction?: React.ReactNode;
  children: React.ReactNode;
  wrapperClassName?: string;
  /**
   * This layout's intended use is on the "home" related screens. To use
   * elsewhere (which will remove the top & bottom insets), set this to
   * `false`.
   */
  withoutHeaderBar?: boolean;
}) {
  const { top } = useSafeAreaInsets();
  const actionPosY = useSharedValue(0);
  const actionOffset = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((e) => {
    const scroll = e.contentOffset.y;

    const maxOffset = top + 16;
    const stickyStart = actionPosY.value - maxOffset;

    let offset = scroll < stickyStart ? 0 : scroll - stickyStart;
    if (offset > maxOffset) offset = maxOffset;
    actionOffset.value = offset;
  });

  const actionStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: actionOffset.value }],
  }));

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={!!StickyAction ? [1] : undefined}
      contentContainerClassName={cn("grow gap-6 p-4", wrapperClassName)}
    >
      <AccentText
        style={[withoutHeaderBar ? { paddingTop: top + 16 } : {}]}
        className="text-3xl"
      >
        {title}
      </AccentText>

      <View
        onLayout={(e) => {
          actionPosY.value = e.nativeEvent.layout.y;
        }}
        pointerEvents="box-none"
        className={cn({ hidden: !StickyAction })}
      >
        <Animated.View
          pointerEvents="box-none"
          // Nested due to Reanimated crashing when an Animated component
          // using an animated style is stickied.
          style={actionStyle}
          className="items-end"
        >
          {StickyAction}
        </Animated.View>
      </View>

      {children}
      {withoutHeaderBar ? <BottomInset /> : null}
    </Animated.ScrollView>
  );
}
//#endregion

//#region Bottom Inset
/**
 * A "block" to help account for the bottom actions displayed while using
 * this layout.
 */
function BottomInset() {
  const { bottomInset } = useBottomActionsLayout();
  return <View style={{ paddingTop: bottomInset }} className="-mt-2" />;
}
//#endRegion

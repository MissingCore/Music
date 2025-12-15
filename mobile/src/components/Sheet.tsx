import { Toasts } from "@backpackapp-io/react-native-toast";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { platformApiLevel } from "expo-device";
import type { ParseKeys } from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { Keyboard, View, useWindowDimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { useTheme } from "~/hooks/useTheme";

import { BorderRadius } from "~/constants/Styles";
import { cn } from "~/lib/style";
import { Marquee } from "./Containment/Marquee";
import { Button } from "./Form/Button";
import { NumericInput } from "./Form/Input";
import { StyledText, TStyledText } from "./Typography/StyledText";

const WrappedGestureHandlerRootView = withUniwind(GestureHandlerRootView);

interface SheetProps {
  children: React.ReactNode;
  ref?: TrueSheetRef;
  /** Makes sheet accessible globally using this key. */
  globalKey?: string;
  /** Title displayed in sheet. */
  titleKey?: ParseKeys;
  /** If the sheet should open at max screen height. */
  snapTop?: boolean;
  /** Styles applied to the internal `GestureHandlerRootView`. */
  contentContainerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Indicates a sheet can display keyboard & toast. */
  keyboardAndToast?: boolean;
}

export type TrueSheetRef = React.Ref<TrueSheet>;

export function useSheetRef() {
  return useRef<TrueSheet>(null);
}

//#region Sheet
export function Sheet({
  ref,
  titleKey,
  globalKey,
  snapTop,
  contentContainerClassName,
  contentContainerStyle,
  keyboardAndToast,
  children,
}: SheetProps) {
  const { t } = useTranslation();
  const { canvasAlt } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [disableToastAnim, setDisableToastAnim] = useState(true);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  // In Android API 35+, the "height" now includes the system decoration
  // areas and display cutout (status & navigation bar heights).
  //  - https://github.com/facebook/react-native/issues/47080#issuecomment-2421914957
  const trueScreenHeight = useMemo(() => {
    if (!platformApiLevel || platformApiLevel < 35) return screenHeight;
    return screenHeight - insets.top - insets.bottom;
  }, [insets.bottom, insets.top, screenHeight]);

  return (
    <TrueSheet
      ref={ref}
      onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
      name={globalKey}
      detents={[snapTop ? 1 : "auto"]}
      backgroundColor={canvasAlt}
      cornerRadius={BorderRadius.lg}
      // Sheet max height will be just before the `<TopAppBar />`.
      maxHeight={trueScreenHeight - 56}
      grabber={false}
      // Re-enable toast animations after sheet is finished presenting.
      onDidPresent={() => setDisableToastAnim(false)}
      // Disable toast animations when sheet is dismissed.
      onDidDismiss={() => setDisableToastAnim(true)}
    >
      <View
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        className={cn("gap-2 px-4 pb-2", { "pb-6": !!titleKey })}
      >
        <View className="mx-auto my-2.5 h-1 w-8 rounded-full bg-onSurface" />
        {titleKey ? (
          <Marquee color="canvasAlt" center>
            <StyledText className="text-lg">{t(titleKey)}</StyledText>
          </Marquee>
        ) : null}
      </View>
      <WrappedGestureHandlerRootView
        style={[
          // TrueSheet doesn't know the actual scrollable area, so we
          // need to exclude the height taken up by the "SheetHeader"
          // from the container that can hold a scrollable.
          [{ maxHeight: trueScreenHeight - 56 - headerHeight }],
          contentContainerStyle,
        ]}
        className={cn(
          "gap-6 p-4 pt-0",
          { "h-full pb-0": snapTop },
          contentContainerClassName,
        )}
      >
        {children}
      </WrappedGestureHandlerRootView>
      <Toasts
        // @ts-expect-error - We added the `sheetOpts` prop via a patch.
        sheetOpts={{
          height: sheetHeight,
          needKeyboardOffset: keyboardAndToast,
        }}
        // A duration of 0 doesn't work.
        globalAnimationConfig={disableToastAnim ? { duration: 1 } : undefined}
      />
    </TrueSheet>
  );
}
//#endregion

//#region Numeric Sheet
interface NumericSheetProps {
  sheetRef: TrueSheetRef;
  titleKey: ParseKeys;
  descriptionKey: ParseKeys;
  value: number;
  setValue: (newValue: number) => void;
}

export function NumericSheet(props: NumericSheetProps) {
  const [newValue, setNewValue] = useState<string | undefined>();

  const onUpdate = useCallback(
    (value: string | undefined) => {
      const asNum = Number(value);
      // Validate that it's a positive integer.
      if (!Number.isInteger(asNum) || asNum < 0) return;
      props.setValue(asNum);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.setValue],
  );

  useEffect(() => {
    const subscription = Keyboard.addListener(
      "keyboardDidHide",
      // Update value when we close the keyboard.
      () => onUpdate(newValue),
    );
    return () => subscription.remove();
  }, [newValue, onUpdate]);

  return (
    <Sheet ref={props.sheetRef} titleKey={props.titleKey}>
      <TStyledText
        textKey={props.descriptionKey}
        className="text-center text-sm"
        dim
      />
      <NumericInput
        defaultValue={`${props.value}`}
        onChangeText={(text) => setNewValue(text)}
        className="mx-auto mb-2 w-full max-w-1/2 border-b border-foreground/60 text-center"
      />
    </Sheet>
  );
}

//#endregion

//#region Sheet Button Group
type ButtonOptions = Omit<PressableProps, "children"> & { textKey: ParseKeys };

export function SheetButtonGroup(props: {
  leftButton: ButtonOptions;
  rightButton: ButtonOptions;
  className?: string;
}) {
  return (
    <View className={cn("flex-row gap-[3px]", props.className)}>
      <Button
        {...props.leftButton}
        className={cn(
          "min-h-14 flex-1 rounded-r-xs",
          props.leftButton.className,
        )}
      >
        <TStyledText
          textKey={props.leftButton.textKey}
          className="text-center text-sm"
          bold
        />
      </Button>
      <Button
        {...props.rightButton}
        className={cn(
          "min-h-14 flex-1 rounded-l-xs",
          props.rightButton.className,
        )}
      >
        <TStyledText
          textKey={props.rightButton.textKey}
          className="text-center text-sm"
          bold
        />
      </Button>
    </View>
  );
}
//#endregion

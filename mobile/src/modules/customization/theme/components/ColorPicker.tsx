import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { HexColor } from "../core/constants";
import { normalizeHexColor } from "../core/utils";

const PANEL_HEIGHT = 200;
const HANDLE_SIZE = 20;
const HUE_SLIDER_HEIGHT = HANDLE_SIZE + 8;

const hueGradientStops = [
  "hsl(0, 100%, 50%)",
  "hsl(60, 100%, 50%)",
  "hsl(120, 100%, 50%)",
  "hsl(180, 100%, 50%)",
  "hsl(240, 100%, 50%)",
  "hsl(300, 100%, 50%)",
  "hsl(360, 100%, 50%)",
] as const;

export function ColorPicker({
  value,
  onComplete,
}: {
  value: HexColor;
  onComplete: (hex: HexColor) => void;
}) {
  const hue = useSharedValue(0);
  const saturation = useSharedValue(0);
  const brightness = useSharedValue(0);

  const contentWidth = useSharedValue(0);

  // Synchronize external color with internal.
  useEffect(() => {
    const normalizedHexColor = normalizeHexColor(value);
    if (
      !normalizedHexColor ||
      //? Prevent "jumping" due to Hex to HSV conversion potentially not resulting in the same value.
      normalizedHexColor ===
        hsvToHex({ h: hue.get(), s: saturation.get(), v: brightness.get() })
    )
      return;

    const asHSV = hexToHSV(normalizedHexColor);
    hue.set(asHSV.h);
    saturation.set(asHSV.s);
    brightness.set(asHSV.v);
  }, [hue, saturation, brightness, value]);

  const emitCurrentColor = useCallback(() => {
    onComplete(
      hsvToHex({ h: hue.get(), s: saturation.get(), v: brightness.get() }),
    );
  }, [hue, saturation, brightness, onComplete]);

  //#region Panel Gestures + Styles
  const panelTapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd(({ x, y }) => {
        if (contentWidth.get() <= 0) return;
        saturation.set(clamp(x / contentWidth.get(), 0, 1));
        brightness.set(clamp(1 - y / PANEL_HEIGHT, 0, 1));

        scheduleOnRN(emitCurrentColor);
      }),
    [contentWidth, saturation, brightness, emitCurrentColor],
  );

  const panelPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate(({ x, y }) => {
          if (contentWidth.get() <= 0) return;
          saturation.set(clamp(x / contentWidth.get(), 0, 1));
          brightness.set(clamp(1 - y / PANEL_HEIGHT, 0, 1));
        })
        .onEnd(() => scheduleOnRN(emitCurrentColor)),
    [contentWidth, saturation, brightness, emitCurrentColor],
  );

  const panelGestures = useMemo(
    () => Gesture.Race(panelTapGesture, panelPanGesture),
    [panelPanGesture, panelTapGesture],
  );

  const panelStyle = useAnimatedStyle(() => ({
    height: PANEL_HEIGHT,
    backgroundColor: `hsl(${hue.get()}, 100%, 50%)`,
  }));

  const panelHandleStyle = useAnimatedStyle(() => ({
    height: HANDLE_SIZE,
    width: HANDLE_SIZE,
    transform: [
      { translateX: saturation.get() * (contentWidth.get() - HANDLE_SIZE) },
      { translateY: (1 - brightness.get()) * (PANEL_HEIGHT - HANDLE_SIZE) },
    ],
    borderColor: brightness.get() > 0.5 ? "#000" : "#FFF",
  }));
  //#endregion

  //#region Hue Slider Gestures + Styles
  const hueTapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd(({ x }) => {
        if (contentWidth.get() <= 0) return;
        hue.set(clamp(((x / contentWidth.get()) * 360) | 0, 0, 360));

        scheduleOnRN(emitCurrentColor);
      }),
    [contentWidth, hue, emitCurrentColor],
  );

  const huePanGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate(({ x }) => {
          if (contentWidth.get() <= 0) return;
          hue.set(clamp(((x / contentWidth.get()) * 360) | 0, 0, 360));
        })
        .onEnd(() => scheduleOnRN(emitCurrentColor)),
    [contentWidth, hue, emitCurrentColor],
  );

  const hueGesture = useMemo(
    () => Gesture.Race(hueTapGesture, huePanGesture),
    [huePanGesture, hueTapGesture],
  );

  const sliderHandleStyle = useAnimatedStyle(() => ({
    height: HANDLE_SIZE,
    width: HANDLE_SIZE,
    transform: [
      { translateX: (hue.get() / 360) * (contentWidth.get() - HANDLE_SIZE) },
      { translateY: "-50%" },
    ],
  }));
  //#endregion

  return (
    <>
      <GestureDetector gesture={panelGestures}>
        <Animated.View
          onLayout={(e) => contentWidth.set(e.nativeEvent.layout.width)}
          style={panelStyle}
          className="relative overflow-hidden rounded-md"
        >
          <LinearGradient
            colors={["#FFFFFFFF", "#FFFFFF00"]}
            start={[0, 0]}
            end={[1, 0]}
            className="absolute inset-0"
          />
          <LinearGradient
            colors={["#000000FF", "#00000000"]}
            start={[0, 1]}
            end={[0, 0]}
            className="absolute inset-0"
          />

          <Animated.View
            style={panelHandleStyle}
            className="absolute top-0 left-0 rounded-full border-2"
          />
        </Animated.View>
      </GestureDetector>

      <GestureDetector gesture={hueGesture}>
        <View
          style={{ height: HUE_SLIDER_HEIGHT }}
          className="relative overflow-hidden rounded-full"
        >
          <LinearGradient
            colors={hueGradientStops}
            start={[0, 0.5]}
            end={[1, 0.5]}
            className="absolute inset-0"
          />
          <Animated.View
            style={sliderHandleStyle}
            className="absolute top-1/2 left-0 rounded-full border-2 border-black"
          />
        </View>
      </GestureDetector>
    </>
  );
}

//#region Helpers
function hexToHSV(hex: HexColor) {
  const [r, g, b] = hex
    .replace("#", "")
    .match(/.{1,2}/g)! // Split by every 2 characters.
    .map((hex) => parseInt(hex, 16) / 255) as [number, number, number];

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  const h =
    delta === 0
      ? 0
      : max === r
        ? 60 * (((g - b) / delta) % 6)
        : max === g
          ? 60 * ((b - r) / delta + 2)
          : 60 * ((r - g) / delta + 4);
  const hue = h < 0 ? h + 360 : h;
  const saturation = max === 0 ? 0 : delta / max;
  const valueV = max;

  return { h: hue, s: saturation, v: valueV };
}

function hsvToHex(hsv: { h: number; s: number; v: number }): HexColor {
  const { h, s, v } = hsv;
  const hh = ((h % 360) + 360) % 360; // normalize
  const c = v * s;
  const hp = hh / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) {
    r1 = c;
    g1 = x;
  } else if (hp < 2) {
    r1 = x;
    g1 = c;
  } else if (hp < 3) {
    g1 = c;
    b1 = x;
  } else if (hp < 4) {
    g1 = x;
    b1 = c;
  } else if (hp < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const m = v - c;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);

  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
//#endregion

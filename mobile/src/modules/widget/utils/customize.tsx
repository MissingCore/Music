import Storage from "expo-sqlite/kv-store";
import type { HexColor } from "react-native-android-widget";
import { createStore } from "zustand/vanilla";

//#region Types
export interface WidgetConfig {
  transparent: boolean;

  bgColor: HexColor;
  textColor: HexColor;
  mutedTextColor: HexColor;

  activeColor: HexColor;
  onActiveColor: HexColor;
  inactiveColor: HexColor;
  onInactiveColor: HexColor;
}

const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  transparent: false,

  bgColor: "#121212",
  textColor: "#FFFFFF",
  mutedTextColor: "#ADADAD",

  activeColor: "#D71921",
  onActiveColor: "#FFFFFF",
  inactiveColor: "#323232",
  onInactiveColor: "#FFFFFF",
};
//#endregion

//#region Cache Store
/** Local cache of widget configs so we don't overload calling the database. */
export const widgetConfigCache = createStore<Record<string, WidgetConfig>>()(
  () => ({}),
);
//#endregion

//#region Helpers
export function getWidgetConfigKey(id: string, type: string) {
  return `WIDGET_${type}_${id}`;
}

export function getWidgetConfig(widgetConfigKey: string): WidgetConfig {
  // First check to see if it's cached.
  const cachedConfig = widgetConfigCache.getState()[widgetConfigKey];
  if (cachedConfig) return cachedConfig;

  const config = Storage.getItemSync(widgetConfigKey);
  if (config) {
    try {
      const storedConfig = JSON.parse(config);
      if (typeof storedConfig === "object" && storedConfig !== null) {
        const formattedConfig = { ...DEFAULT_WIDGET_CONFIG, ...storedConfig };
        widgetConfigCache.setState({ [widgetConfigKey]: formattedConfig });
        return formattedConfig;
      }
    } catch {}
  }

  widgetConfigCache.setState({ [widgetConfigKey]: DEFAULT_WIDGET_CONFIG });
  return DEFAULT_WIDGET_CONFIG;
}

export function deleteWidgetConfig(widgetConfigKey: string) {
  Storage.removeItemSync(widgetConfigKey);
}

export function updateWidgetConfig(
  widgetConfigKey: string,
  config: WidgetConfig,
) {
  try {
    widgetConfigCache.setState({ [widgetConfigKey]: config });

    const stringifiedConfig = JSON.stringify(config);
    Storage.setItemSync(widgetConfigKey, stringifiedConfig);
  } catch {}
}
//#endregion

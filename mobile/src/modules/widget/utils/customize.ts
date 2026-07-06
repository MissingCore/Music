// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import Storage from "expo-sqlite/kv-store";
import { createStore } from "zustand/vanilla";

import { DEFAULT_WIDGET_CONFIG } from "../constants/Config";
import type { WidgetConfig } from "../types";

//#region Helpers
export function getWidgetConfigKey(id: string | number, type: string) {
  return `WIDGET_${type}_${id}`;
}

export function isWidgetConfigSupported(widgetConfigKey: string) {
  return widgetConfigKey.startsWith("WIDGET_ResizableNowPlaying");
}
//#endregion

//#region Config Persistence

/** Local cache of widget configs so we don't overload calling the database. */
export const widgetConfigCache = createStore<Record<string, WidgetConfig>>()(
  () => ({}),
);

export async function getWidgetConfig(
  widgetConfigKey: string,
): Promise<WidgetConfig> {
  if (!isWidgetConfigSupported(widgetConfigKey)) return DEFAULT_WIDGET_CONFIG;

  // First check to see if it's cached.
  const cachedConfig = widgetConfigCache.getState()[widgetConfigKey];
  if (cachedConfig) return cachedConfig;

  const config = await Storage.getItemAsync(widgetConfigKey);
  if (config) {
    try {
      const storedConfig = JSON.parse(config);
      // Verify we're storing an object.
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

export async function deleteWidgetConfig(widgetConfigKey: string) {
  if (!isWidgetConfigSupported(widgetConfigKey)) return;

  //? We get the following error if we use the sync method:
  //?   - "Error: Call to function 'NativeDatabase.prepareAsync' has been rejected."
  //?
  //? This method might get called on a previously deleted widget due to
  //? weird behavior that appeared with New Architecture implementation.
  await Storage.removeItemAsync(widgetConfigKey);
}

export async function updateWidgetConfig(
  widgetConfigKey: string,
  config: WidgetConfig,
) {
  if (!isWidgetConfigSupported(widgetConfigKey)) return;

  try {
    widgetConfigCache.setState({ [widgetConfigKey]: config });

    const stringifiedConfig = JSON.stringify(config);
    await Storage.setItemAsync(widgetConfigKey, stringifiedConfig);
  } catch {}
}
//#endregion

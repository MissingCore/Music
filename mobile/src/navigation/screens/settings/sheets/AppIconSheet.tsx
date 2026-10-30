// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { IconName } from "@howincodes/expo-dynamic-app-icon";
import { getAppIcon, setAppIcon } from "@howincodes/expo-dynamic-app-icon";
import { useEffect, useState } from "react";
import { BackHandler } from "react-native";

import { FlatList } from "~/components/Base/List";
import { Ripple } from "~/components/next/base/ripple";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { Image } from "~/components/next/primitive/image";

type AppIcons = IconName | "DEFAULT";
type AppIconConfig = { label: string; icon: any };

const SupportedIcons = {
  DEFAULT: {
    label: "Default Dark",
    icon: require("../../../../../assets/dark/icon.png"),
  },
  defaultLight: {
    label: "Default Light",
    icon: require("../../../../../assets/light/icon.png"),
  },
} as const satisfies Record<AppIcons, AppIconConfig>;

const ListOptions = Object.entries(SupportedIcons) as Array<
  [AppIcons, AppIconConfig]
>;

export function AppIconSheet(props: { ref: SheetRef }) {
  const [activeIcon, setActiveIcon] = useState<AppIcons>();

  useEffect(() => {
    getAppIcon().then(setActiveIcon);
  }, []);

  if (!activeIcon) return null;
  return (
    <Sheet ref={props.ref}>
      <FlatList
        horizontal
        data={ListOptions}
        keyExtractor={([id]) => id}
        renderItem={({ item: [id, config] }) => (
          <Ripple
            accessibilityLabel={config.label}
            onPress={async () => {
              const newIcon = await setAppIcon(
                id === "DEFAULT" ? null : id,
                false,
              );
              if (newIcon === false) return;
              setActiveIcon(newIcon);
              BackHandler.exitApp();
            }}
            disabled={id === activeIcon}
            className="rounded-lg"
          >
            <Image source={config.icon} className="size-16" />
          </Ripple>
        )}
        className="-mx-4"
        contentContainerClassName="gap-4 p-4"
      />
    </Sheet>
  );
}

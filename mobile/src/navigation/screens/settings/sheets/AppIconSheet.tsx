// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { IconName } from "@howincodes/expo-dynamic-app-icon";
import { getAppIcon, setAppIcon } from "@howincodes/expo-dynamic-app-icon";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BackHandler } from "react-native";

import { cn } from "~/lib/style";
import { bgWait } from "~/utils/promise";
import { FlatList } from "~/components/Base/List";
import { Ripple } from "~/components/next/base/ripple";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { Image } from "~/components/next/primitive/image";

type AppIcon = IconName | "DEFAULT";
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
  glyphNote: {
    label: "Glyph Note",
    icon: require("../../../../../assets/glyph-note-icon.png"),
  },
} as const satisfies Record<AppIcon, AppIconConfig>;

const ListOptions = Object.entries(SupportedIcons) as Array<
  [AppIcon, AppIconConfig]
>;

export function getAppIconName(icon: AppIcon) {
  return SupportedIcons[icon].label;
}

//#region Store Hook
const queryKey = ["appearance", "app-icon"] as const;

export function useCurrentAppIcon() {
  return useQuery({ queryKey, queryFn: getAppIcon, gcTime: Infinity });
}
//#endregion

export function AppIconSheet(props: { ref: SheetRef; initIcon: AppIcon }) {
  const queryClient = useQueryClient();
  const [activeIcon, setActiveIcon] = useState(props.initIcon);
  const [blockClicks, setBlockClicks] = useState(false);

  return (
    <Sheet ref={props.ref}>
      <FlatList
        horizontal
        data={ListOptions}
        keyExtractor={([id]) => id}
        renderItem={({ item: [id, config] }) => {
          const selected = id === activeIcon;
          return (
            <Ripple
              accessibilityLabel={config.label}
              onPress={async () => {
                setBlockClicks(true);
                const newIcon = await setAppIcon(
                  id === "DEFAULT" ? null : id,
                  false,
                );
                if (newIcon === false) return setBlockClicks(false);
                //? Override query cache as `BackHandler.exitApp()` just
                //? backgrounds the app, not restart it (which would reset
                //? the query).
                queryClient.setQueryData(queryKey, newIcon);
                setActiveIcon(newIcon);
                await bgWait(250);
                setBlockClicks(false);
                BackHandler.exitApp();
              }}
              disabled={selected || blockClicks}
              className={cn("rounded-[27] border border-transparent p-0.5", {
                "border-onSurfaceVariant": selected,
              })}
            >
              <Image source={config.icon} className="size-24 rounded-xl" />
            </Ripple>
          );
        }}
        className="-mx-4"
        contentContainerClassName="gap-4 p-4"
      />
    </Sheet>
  );
}

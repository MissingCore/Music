// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { LibraryTab } from "~/stores/Preference/types";

import { Icon } from "~/components/next/base/icon";
import { IconButton } from "~/components/next/base/button-icon";
import { Ripple } from "~/components/next/base/ripple";
import type { SheetRef } from "~/components/next/base/sheet";
import { useSheetRef } from "~/components/next/base/sheet";
import { TText } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";
import { RadioSheet } from "~/components/next/composed/sheet-radio";
import { Toolbar } from "~/components/next/composed/toolbar";

export function RootToolbar(props: { libraryTab?: LibraryTab }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const libraryTabSelectionSheetRef = useSheetRef();

  return (
    <>
      {props.libraryTab ? (
        <LibraryTabSelectionSheet
          ref={libraryTabSelectionSheetRef}
          activeTab={props.libraryTab}
        />
      ) : null}

      <Toolbar>
        <Toolbar.Actions>
          {props.libraryTab ? (
            <IconButton
              icon="home"
              accessibilityLabel={t("term.home")}
              onPress={() =>
                navigation.navigate("HomeScreens", { screen: "Home" })
              }
            />
          ) : (
            <Icon
              name="home-filled"
              className="size-10 items-center justify-center"
            />
          )}
          {props.libraryTab ? (
            <Ripple
              onPress={() => libraryTabSelectionSheetRef.current?.present()}
              className="shrink flex-row items-center rounded-full"
            >
              <Icon name="library-music-filled" className="p-2" />
              <Marquee center wrapperClassName="min-w-14 grow-0">
                <TText textKey={`term.${props.libraryTab}s`} size="sm" />
              </Marquee>
              <Icon name="unfold-more" className="p-2" />
            </Ripple>
          ) : (
            <IconButton
              icon="library-music"
              accessibilityLabel={t("term.library")}
              onPress={() =>
                // @ts-expect-error - We don't want to update the Library history.
                navigation.navigate("HomeScreens", { screen: "Library" })
              }
            />
          )}
        </Toolbar.Actions>
        <Toolbar.FAB
          icon="search"
          accessibilityLabel={t("feat.search.title")}
          onPress={() => navigation.navigate("Search")}
          intent="inverse"
        />
      </Toolbar>
    </>
  );
}

//#region Library Tab Selection Sheet
function LibraryTabSelectionSheet(props: {
  ref: SheetRef;
  activeTab: LibraryTab;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const options = useMemo(
    () => [
      { type: "album", label: t("term.albums") } as const,
      { type: "artist", label: t("term.artists") } as const,
      { type: "folder", label: t("term.folders") } as const,
      { type: "genre", label: t("term.genres") } as const,
      { type: "playlist", label: t("term.playlists") } as const,
      { type: "track", label: t("term.tracks") } as const,
    ],
    [t],
  );

  return (
    <RadioSheet
      ref={props.ref}
      data={options}
      // @ts-expect-error - Typing for screen params is correct.
      onSelect={({ type }) => navigation.setParams({ screen: type })}
      isSelected={(item) => item.type === props.activeTab}
    />
  );
}
//#endregion

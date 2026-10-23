// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { IconButton } from "~/components/next/base/button-icon";
import { Toolbar } from "~/components/next/composed/toolbar";

export function RootToolbar() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <Toolbar>
      <Toolbar.Actions>
        <IconButton
          icon="home"
          accessibilityLabel={t("term.home")}
          onPress={() => navigation.navigate("HomeScreens", { screen: "Home" })}
        />
        <IconButton
          icon="library-music"
          accessibilityLabel={t("term.library")}
          onPress={() =>
            // @ts-expect-error - We don't want to update the Library history.
            navigation.navigate("HomeScreens", { screen: "Library" })
          }
        />
      </Toolbar.Actions>
      <Toolbar.FAB
        icon="search"
        accessibilityLabel={t("feat.search.title")}
        onPress={() => navigation.navigate("Search")}
        intent="inverse"
      />
    </Toolbar>
  );
}

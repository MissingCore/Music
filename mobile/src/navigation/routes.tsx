// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import type {
  NavigatorScreenParams,
  StaticScreenProps,
} from "@react-navigation/native";
import { createStaticNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PortalHost } from "@rn-primitives/portal";

import Home from "./screens/HomeView";
import Library from "./screens/LibraryView";
import Album from "./screens/albums/CurrentView";
import ModifyAlbum from "./screens/albums/ModifyView";
import Artist from "./screens/artists/CurrentView";
import Genre from "./screens/genres/CurrentView";
import Upcoming from "./screens/now-playing/UpcomingView";
import NowPlaying from "./screens/now-playing/View";
import CreatePlaylist from "./screens/playlists/CreateView";
import Playlist from "./screens/playlists/CurrentView";
import ModifyPlaylist from "./screens/playlists/ModifyView";
import AboutApp from "./screens/settings/AboutView";
import AppearanceSettings from "./screens/settings/AppearanceSettingsView";
import AppUpdate from "./screens/settings/AppUpdateView";
import ExperimentalSettings from "./screens/settings/ExperimentalSettingsView";
import PackageLicense from "./screens/settings/PackageLicenseView";
import PlaybackSettings from "./screens/settings/PlaybackSettingsView";
import ScanningSettings from "./screens/settings/ScanningSettingsView";
import ThirdParty from "./screens/settings/ThirdPartyView";
import Settings from "./screens/settings/View";
import ModifyTrack from "./screens/tracks/ModifyView";
import { TrackSheet } from "./screens/tracks/sheets/TrackSheet";
import { ArtistsSheet } from "./sheets/ArtistsSheet";
import AudioEffectScreenGroup from "~/modules/audio/_screens";
import ThemeScreenGroup from "~/modules/customization/theme/screens";
import InsightsScreenGroup from "~/modules/insights/screens";
import LyricScreenGroup from "~/modules/lyric/screens";
import Search from "~/modules/search/screens/View";

import { usePreferenceStore } from "~/stores/Preference/store";
import type { LibraryTab } from "~/stores/Preference/types";

import { capitalize } from "~/utils/string";
import { Toolbar } from "~/components/next/composed/toolbar";
import { TrackMultiSelectListeners } from "~/modules/media/multiSelect/components/TrackMultiSelectListeners";
import { BottomActions } from "./components/BottomActions";
import { RootToolbar } from "./components/BottomActions/RootToolbar";
import { DeferredRender } from "./components/DeferredRender";
import { TopAppBar } from "./components/TopAppBar";

//#region Root Screens
const MaterialTopTab = createMaterialTopTabNavigator();

const noop = () => null;

type RootScreensProps = StaticScreenProps<
  NavigatorScreenParams<{
    Home: undefined;
    Library: { screen: LibraryTab; folderPath?: string };
  }>
>;

function RootScreens(_: RootScreensProps) {
  const defaultTabName = usePreferenceStore((s) =>
    capitalize(s.defaultOpenTab),
  );
  return (
    <MaterialTopTab.Navigator
      initialRouteName={defaultTabName}
      backBehavior="initialRoute"
      tabBar={noop}
      screenOptions={{ lazy: true }}
    >
      <MaterialTopTab.Screen name="Home" component={Home} />
      <MaterialTopTab.Screen
        name="Library"
        // @ts-expect-error - Typing for screens should be compatible.
        component={Library}
        initialParams={{}}
      />
    </MaterialTopTab.Navigator>
  );
}
//#endregion

//#region Static Route Config
export const RootStack = createNativeStackNavigator({
  initialRouteName: "HomeScreens",
  layout: ({ children }) => (
    <>
      {children}
      <BottomActions />
      <TrackSheet />
      <ArtistsSheet />
      <TrackMultiSelectListeners />
      <PortalHost />
      <Toolbar.Provider />
    </>
  ),
  screenLayout: ({ children }) => <DeferredRender>{children}</DeferredRender>,
  screenOptions: {
    header: TopAppBar,
    title: "",
  },
  screens: {
    HomeScreens: {
      screen: RootScreens,
      layout: ({ children }) => (
        <>
          <RootToolbar />
          {children}
        </>
      ),
      options: { headerShown: false },
    },
    NowPlaying: {
      screen: NowPlaying,
      linking: {
        path: "now-playing",
      },
      //? Prevents blank screen when opening caused by deferred render.
      layout: ({ children }) => children,
      options: {
        headerShown: false,
        presentation: "formSheet",
        sheetCornerRadius: 24,
        sheetElevation: 0,
        sheetShouldOverflowTopInset: true,
      },
    },
    Search,
    Upcoming: {
      screen: Upcoming,
      options: {
        headerShown: false,
        presentation: "formSheet",
        sheetCornerRadius: 24,
        sheetElevation: 0,
        sheetShouldOverflowTopInset: true,
      },
    },
  },
  groups: {
    AudioEffect: AudioEffectScreenGroup,
    Current: {
      screenOptions: { headerShown: false },
      screens: {
        Playlist,
        Album,
        Artist,
        Genre,
      },
    },
    Form: {
      screenOptions: { headerShown: false },
      screens: {
        ModifyAlbum,
        CreatePlaylist,
        ModifyPlaylist,
        ModifyTrack,
      },
    },
    Insights: InsightsScreenGroup,
    Lyric: LyricScreenGroup,
    Setting: {
      screenLayout: ({ children }) => (
        <>
          <Toolbar.Default />
          {children}
        </>
      ),
      screenOptions: {
        animation: "fade",
        headerShown: false,
      },
      screens: {
        Settings: {
          screen: Settings,
          options: { animation: "default" },
        },
        AppUpdate,
        AppearanceSettings,
        PlaybackSettings,
        ScanningSettings,
        ExperimentalSettings,
        About: {
          screen: AboutApp,
        },
        ThirdParty,
        PackageLicense,
      },
    },
    Theme: ThemeScreenGroup,
  },
});

export const Navigation = createStaticNavigation(RootStack);
//#endregion

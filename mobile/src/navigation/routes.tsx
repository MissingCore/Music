import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import type {
  EventArg,
  NavigatorScreenParams,
  ParamListBase,
  StaticScreenProps,
  TabNavigationState,
} from "@react-navigation/native";
import {
  createStaticNavigation,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useCallback, useMemo, useRef } from "react";
import { BackHandler, View } from "react-native";

import Home from "./screens/HomeView";
import { ModifyTrack } from "~/screens/ModifyTrack";
import NowPlaying from "./screens/NowPlayingView";
import RecentlyPlayed from "./screens/RecentlyPlayedView";
import Search from "./screens/SearchView";
import Album from "./screens/albums/CurrentView";
import Albums from "./screens/albums/View";
import Artist from "./screens/artists/CurrentView";
import Artists from "./screens/artists/View";
import Folders from "./screens/folders/View";
import CreatePlaylist from "./screens/playlists/CreateView";
import Playlist from "./screens/playlists/CurrentView";
import ModifyPlaylist from "./screens/playlists/ModifyView";
import Playlists from "./screens/playlists/View";
import AppearanceSettings from "./screens/settings/AppearanceSettingsView";
import AppUpdate from "./screens/settings/AppUpdateView";
import ExperimentalSettings from "./screens/settings/ExperimentalSettingsView";
import HiddenTracks from "./screens/settings/HiddenTracksView";
import HomeTabOrderSettings from "./screens/settings/HomeTabOrderSettingsView";
import Insights from "./screens/settings/InsightsView";
import PackageLicense from "./screens/settings/PackageLicenseView";
import PlaybackSettings from "./screens/settings/PlaybackSettingsView";
import SaveErrors from "./screens/settings/SaveErrorsView";
import ScanningSettings from "./screens/settings/ScanningSettingsView";
import ThirdParty from "./screens/settings/ThirdPartyView";
import Settings from "./screens/settings/View";
import FavoriteTracks from "./screens/tracks/FavoritesView";
import Tracks from "./screens/tracks/View";

import {
  useTabsByVisibility,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { NowPlayingTopAppBar } from "~/screens/NowPlaying/TopAppBar";

import { TopAppBar } from "~/components/TopAppBar";
import type { HomeScreenNames } from "./components/BottomActions";
import { BottomActions, getHomeScreenName } from "./components/BottomActions";

//#region Root Screens
type TabState = EventArg<
  "state",
  any,
  { state: TabNavigationState<ParamListBase> }
>;

const MaterialTopTab = createMaterialTopTabNavigator();

const noop = () => null;

const RootScreenComponents = {
  album: Albums,
  artist: Artists,
  folder: Folders,
  playlist: Playlists,
  track: Tracks,
} as const;

type RootScreensProps = StaticScreenProps<
  NavigatorScreenParams<{
    Home: undefined;
    Folders: { path?: string } | undefined;
    Playlists: undefined;
    Tracks: undefined;
    Albums: undefined;
    Artists: undefined;
  }>
>;

function RootScreens(_: RootScreensProps) {
  const navigation = useNavigation();
  const homeTab = useUserPreferencesStore((s) => s.homeTab);
  const { displayedTabs, hiddenTabs } = useTabsByVisibility();
  // Should be fine to store history stack in ref as it doesn't affect rendering.
  //  - https://react.dev/learn/referencing-values-with-refs#when-to-use-refs
  const historyStack = useRef<string[]>([]);

  const homeTabName = useMemo(() => getHomeScreenName(homeTab), [homeTab]);

  /** Manually handle the back gesture since the old strategy no longer works. */
  const onBackGesture = useCallback(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Remove hidden tabs before handling back gesture.
        historyStack.current = historyStack.current.filter(
          (screenName) =>
            !hiddenTabs.some((t) =>
              screenName.startsWith(`${getHomeScreenName(t)}-`),
            ),
        );
        if (historyStack.current.length === 1) return false;
        const prevScreenName = historyStack.current.at(-2)!.split("-")[0]!;
        navigation.navigate("HomeScreens", {
          screen: prevScreenName as HomeScreenNames,
        });
        return true;
      },
    );
    return () => subscription.remove();
  }, [navigation, hiddenTabs]);

  useFocusEffect(onBackGesture);

  /** Have Tab history operate like Stack history. */
  const trackHistoryStack = useCallback((e: TabState) => {
    // Get top of history.
    const { key: currKey } = e.data.state.history.at(-1)!;
    if (historyStack.current.length === 0) {
      // Initiate the current history stack by putting in the "Home" route.
      historyStack.current.push(currKey);
    } else {
      // See if route was seen previously.
      const atIndex = historyStack.current.findIndex((k) => currKey === k);
      // Handle if we visited this tab earlier.
      if (atIndex !== -1) {
        historyStack.current = historyStack.current.toSpliced(atIndex + 1);
      } else {
        historyStack.current.push(currKey);
      }
    }
  }, []);

  const listeners = useMemo(
    () => ({ state: trackHistoryStack }),
    [trackHistoryStack],
  );

  return (
    <View className="flex-1">
      <MaterialTopTab.Navigator
        initialRouteName={homeTabName}
        backBehavior="none"
        tabBar={noop}
        screenListeners={listeners}
        screenOptions={{
          sceneStyle: { backgroundColor: "transparent" },
        }}
      >
        <MaterialTopTab.Screen name="Home" component={Home} />
        {displayedTabs.map((tabKey) => (
          <MaterialTopTab.Screen
            key={tabKey}
            name={getHomeScreenName(tabKey)}
            // @ts-expect-error - Typing for screens should be compatible.
            component={RootScreenComponents[tabKey]}
            options={{ lazy: true }}
          />
        ))}
      </MaterialTopTab.Navigator>
      <BottomActions />
    </View>
  );
}
//#endregion

//#region Static Route Config
export const RootStack = createNativeStackNavigator({
  initialRouteName: "HomeScreens",
  screenOptions: {
    header: TopAppBar,
    headerShown: false,
    contentStyle: {
      backgroundColor: "transparent",
    },
  },
  screens: {
    HomeScreens: RootScreens,
    NowPlaying: {
      screen: NowPlaying,
      options: {
        animation: "slide_from_bottom",
        header: NowPlayingTopAppBar,
        headerTransparent: true,
        headerShown: true,
        headerTitle: "",
      },
    },
    Search: {
      screen: Search,
      options: { headerShown: true, title: "" },
    },
    Settings: {
      screen: Settings,
      options: { headerShown: true, title: "term.settings" },
    },
  },
  groups: {
    Current: {
      screenOptions: {
        headerShown: true,
      },
      screens: {
        FavoriteTracks: { screen: FavoriteTracks, options: { title: "" } },
        CreatePlaylist: { screen: CreatePlaylist, options: { title: "" } },
        ModifyPlaylist: { screen: ModifyPlaylist, options: { title: "" } },
        Playlist: { screen: Playlist, options: { title: "" } },
        Album: { screen: Album, options: { title: "" } },
        Artist: { screen: Artist, options: { title: "" } },
        RecentlyPlayed: {
          screen: RecentlyPlayed,
          options: { title: "feat.playedRecent.title" },
        },
        ModifyTrack: { screen: ModifyTrack, options: { title: "" } },
      },
    },
    Setting: {
      screenOptions: {
        animation: "fade",
        headerShown: true,
      },
      screens: {
        AppUpdate: {
          screen: AppUpdate,
          options: { title: "feat.appUpdate.title" },
        },
        AppearanceSettings: {
          screen: AppearanceSettings,
          options: { title: "feat.appearance.title" },
        },
        HomeTabOrderSettings: {
          screen: HomeTabOrderSettings,
          options: { title: "feat.homeTabsOrder.title" },
        },
        Insights: {
          screen: Insights,
          options: { title: "feat.insights.title" },
        },
        HiddenTracks: {
          screen: HiddenTracks,
          options: { title: "feat.hiddenTracks.title" },
        },
        SaveErrors: {
          screen: SaveErrors,
          options: { title: "feat.saveErrors.title" },
        },
        PlaybackSettings: {
          screen: PlaybackSettings,
          options: { title: "feat.playback.title" },
        },
        ScanningSettings: {
          screen: ScanningSettings,
          options: { title: "feat.scanning.title" },
        },
        ExperimentalSettings: {
          screen: ExperimentalSettings,
          options: { title: "feat.experimental.title" },
        },
        ThirdParty: {
          screen: ThirdParty,
          options: { title: "feat.thirdParty.title" },
        },
        PackageLicense: { screen: PackageLicense, options: { title: "" } },
      },
    },
  },
});

export const Navigation = createStaticNavigation(RootStack);
//#endregion

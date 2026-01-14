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
import { BackHandler } from "react-native";

import Home from "./screens/HomeView";
import RecentlyPlayed from "./screens/RecentlyPlayedView";
import Search from "./screens/SearchView";
import Album from "./screens/albums/CurrentView";
import Albums from "./screens/albums/View";
import Artist from "./screens/artists/CurrentView";
import Artists from "./screens/artists/View";
import Folders from "./screens/folders/View";
import Lyrics from "./screens/lyrics/View";
import Upcoming from "./screens/now-playing/UpcomingView";
import NowPlaying from "./screens/now-playing/View";
import CreatePlaylist from "./screens/playlists/CreateView";
import Playlist from "./screens/playlists/CurrentView";
import ModifyPlaylist from "./screens/playlists/ModifyView";
import Playlists from "./screens/playlists/View";
import AppearanceSettings from "./screens/settings/AppearanceSettingsView";
import AppUpdate from "./screens/settings/AppUpdateView";
import ExperimentalSettings from "./screens/settings/ExperimentalSettingsView";
import HiddenTracks from "./screens/settings/HiddenTracksView";
import Insights from "./screens/settings/InsightsView";
import MostPlayed from "./screens/settings/MostPlayedView";
import PackageLicense from "./screens/settings/PackageLicenseView";
import PlaybackSettings from "./screens/settings/PlaybackSettingsView";
import SaveErrors from "./screens/settings/SaveErrorsView";
import ScanningSettings from "./screens/settings/ScanningSettingsView";
import ThirdParty from "./screens/settings/ThirdPartyView";
import Settings from "./screens/settings/View";
import FavoriteTracks from "./screens/tracks/FavoritesView";
import ModifyTrack from "./screens/tracks/ModifyView";
import { TrackSheet } from "./screens/tracks/Sheet";
import Tracks from "./screens/tracks/View";

import { preferenceStore, usePreferenceStore } from "~/stores/Preference/store";
import { useTabsByVisibility } from "~/stores/Preference/hooks";

import type { HomeScreenNames } from "./components/BottomActions";
import { BottomActions, getHomeScreenName } from "./components/BottomActions";
import { DeferredRender } from "./components/DeferredRender";
import { TopAppBar } from "./components/TopAppBar";
import { NowPlayingTopAppBar } from "./screens/now-playing/components/TopAppBar";

//#region Root Screens
type TabState = EventArg<
  "state",
  any,
  { state: TabNavigationState<ParamListBase> }
>;

const MaterialTopTab = createMaterialTopTabNavigator();

let canResetHomeScreens = false;
const noop = () => null;

const RootScreenComponents = {
  album: Albums,
  artist: Artists,
  folder: Folders,
  home: Home,
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
  const homeTab = usePreferenceStore((s) => s.homeTab);
  const { displayedTabs, hiddenTabs } = useTabsByVisibility();
  // Should be fine to store history stack in ref as it doesn't affect rendering.
  //  - https://react.dev/learn/referencing-values-with-refs#when-to-use-refs
  const historyStack = useRef<string[]>([]);

  const homeTabName = useMemo(() => {
    if (!displayedTabs.includes(homeTab)) {
      // FIXME: Current workaround to `Couldn't find a screen named 'Home'
      // to use as 'initialRouteName'.` after the `v2.6.0` release.
      //  - One of the potential causes is the migration failing as some
      //  users also encountered `Call to function 'NativeDatabase.prepareAsync'
      //  has been rejected.`.
      //  - Though there were some users got the screen error but didn't encounter
      //  the database issue.
      if (!canResetHomeScreens) {
        canResetHomeScreens = true;
        // Reset home tab preferences if we have a mismatch.
        preferenceStore.setState({
          homeTab: "home",
          tabsOrder: ["home", "folder", "playlist", "track", "album", "artist"],
          tabsVisibility: {
            album: true,
            artist: true,
            folder: true,
            home: true,
            playlist: true,
            track: true,
          },
        });
      }
      if (!displayedTabs[0]) return undefined;
      return getHomeScreenName(displayedTabs[0]);
    }
    return getHomeScreenName(homeTab);
  }, [displayedTabs, homeTab]);

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
    <MaterialTopTab.Navigator
      initialRouteName={homeTabName}
      backBehavior="none"
      tabBar={noop}
      screenListeners={listeners}
    >
      {displayedTabs.map((tabKey) => (
        <MaterialTopTab.Screen
          key={tabKey}
          name={getHomeScreenName(tabKey)}
          // @ts-expect-error - Typing for screens should be compatible.
          component={RootScreenComponents[tabKey]}
          initialParams={tabKey === "folder" ? { path: undefined } : {}}
          options={{ lazy: true }}
        />
      ))}
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
      layout: ({ children }) => children,
      options: {
        headerShown: false,
        freezeOnBlur: true,
      },
    },
    NowPlaying: {
      screen: NowPlaying,
      linking: {
        path: "now-playing",
      },
      layout: ({ children }) => children,
      options: {
        animation: "slide_from_bottom",
        header: NowPlayingTopAppBar,
        headerTransparent: true,
      },
    },
    Search,
    Settings: {
      screen: Settings,
      options: { title: "term.settings" },
    },
    Upcoming: {
      screen: Upcoming,
      options: { title: "term.upcoming" },
    },
  },
  groups: {
    Current: {
      screens: {
        FavoriteTracks,
        CreatePlaylist,
        ModifyPlaylist: {
          screen: ModifyPlaylist,
          layout: ({ children }) => children,
        },
        Playlist,
        Album,
        Artist,
        RecentlyPlayed: {
          screen: RecentlyPlayed,
          options: { title: "feat.playedRecent.title" },
        },
        ModifyTrack,
      },
    },
    Lyric: {
      screenLayout: ({ children }) => children,
      screenOptions: {
        animation: "fade",
      },
      screens: {
        Lyrics: {
          screen: Lyrics,
          options: { title: "feat.lyrics.title" },
        },
      },
    },
    Setting: {
      screenLayout: ({ children }) => children,
      screenOptions: {
        animation: "fade",
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
        Insights: {
          screen: Insights,
          layout: ({ children }) => <DeferredRender>{children}</DeferredRender>,
          options: { title: "feat.insights.title" },
        },
        HiddenTracks: {
          screen: HiddenTracks,
          options: { title: "feat.hiddenTracks.title" },
        },
        MostPlayed: {
          screen: MostPlayed,
          options: { title: "feat.mostPlayed.title" },
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
        PackageLicense,
      },
    },
  },
});

export const Navigation = createStaticNavigation(RootStack);
//#endregion

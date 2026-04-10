import type { ExpoConfig } from "expo/config";
import type { WithAndroidWidgetsParams } from "react-native-android-widget";

const BUILD_THEME: "light" | "dark" = "light";
const BACKGROUND_COLOR = BUILD_THEME === "light" ? "#F2F2F2" : "#000000";
const ICON_BACKGROUND_COLOR = BUILD_THEME === "light" ? "#FFFFFF" : "#000000";

export default (): ExpoConfig => {
  const optionalPlugins: ExpoConfig["plugins"] = [];

  //? Even if we uninstall `@sentry/react-native`, the build will fail
  //? due to it being referenced in the plugin.
  if (process.env.EXPO_PUBLIC_WITH_SENTRY === "true") {
    optionalPlugins.push(["@sentry/react-native/expo", sentryPluginConfig]);
  }

  return {
    name: "Music",
    slug: "Music",
    description: "A Nothing inspired music player.",
    version: "3.0.0-rc.6",
    platforms: ["android"],
    githubUrl: "https://github.com/MissingCore/Music",
    orientation: "portrait",
    primaryColor: "#C8102E",
    icon: `./assets/${BUILD_THEME}/icon.png`,
    scheme: ["com.cyanchill.missingcore.music"],
    backgroundColor: BACKGROUND_COLOR,
    userInterfaceStyle: "automatic",
    assetBundlePatterns: ["**/*"],
    android: {
      package: "com.cyanchill.missingcore.music",
      versionCode: 2050,
      adaptiveIcon: {
        foregroundImage: `./assets/${BUILD_THEME}/adaptive-icon.png`,
        monochromeImage: `./assets/${BUILD_THEME}/adaptive-icon-monochrome.png`,
        backgroundColor: ICON_BACKGROUND_COLOR,
      },
      blockedPermissions: [
        // Optional permissions that Expo adds.
        "android.permission.VIBRATE",
        // From `expo-image-picker`.
        "android.permission.CAMERA",
        // From `expo-media-library`.
        "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
      ],
      intentFilters: [
        // Whenever we rebuild the `AndroidManifest.xml` file, we should delete
        // the generated "MAIN" intent filter.
        {
          action: "MAIN",
          category: ["DEFAULT", "LAUNCHER", "APP_MUSIC"],
        },
        // Allows us to "Open With" on music files.
        {
          action: "VIEW",
          category: ["DEFAULT", "BROWSABLE"],
          data: [
            // Recieve intent from `file://` & `content://` URIs.
            { scheme: "content" },
            { scheme: "file" },
            // Normal audio mime types + weird mime types we can "Open With".
            { mimeType: "audio/*" },
            { mimeType: "application/ogg" },
            { mimeType: "application/x-ogg" },
            { mimeType: "application/itunes" },
          ],
        },
      ],
    },
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            enableBundleCompression: true,
            enableMinifyInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
          },
        },
      ],
      [
        "expo-font",
        {
          fonts: [
            "assets/fonts/Roboto-Regular.ttf",
            "assets/fonts/Roboto-Medium.ttf",
            "assets/fonts/Inter-Regular.ttf",
            "assets/fonts/Inter-Medium.ttf",
            "assets/fonts/GeistMono-Regular.ttf",
            "assets/fonts/GeistMono-Medium.ttf",
            "assets/fonts/Ndot-77_JP_Extended.ttf",
            "assets/fonts/NType82-Headline.otf",
          ],
        },
      ],
      ["expo-image-picker", { microphonePermission: false }],
      ["expo-media-library", { granularPermissions: ["audio"] }],
      [
        "react-native-bootsplash",
        {
          logo: `./assets/${BUILD_THEME}/splash-icon.png`,
          background: BACKGROUND_COLOR,
          assetsOutput: `./assets/${BUILD_THEME}/bootsplash`,
        },
      ],
      [
        "@zoontek/react-native-navigation-bar",
        { android: { enforceNavigationBarContrast: false } },
      ],
      ["react-native-android-widget", widgetPluginConfig],
      ...optionalPlugins,
    ],
  };
};

//#region Sentry Plugin Configs
const sentryPluginConfig = {
  project: "music",
  organization: "missingcore",
  experimental_android: {
    enableAndroidGradlePlugin: true,
    autoUploadProguardMapping: true,
    uploadNativeSymbols: true,
    includeNativeSources: true,
    includeSourceContext: true,
  },
};
//#endregion

//#region Widget Plugin Configs
const widgetPluginConfig: WithAndroidWidgetsParams = {
  widgets: [
    {
      name: "ArtworkPlayer",
      label: "🧪 Artwork Player",
      minWidth: "110dp",
      minHeight: "110dp",
      targetCellWidth: 2,
      targetCellHeight: 2,
      description:
        "[Experimental] Displays track artwork and allows for play/pause.",
      previewImage: "./assets/widget/artwork-player.png",
    },
    {
      name: "NowPlaying",
      label: "🧪 Now Playing",
      minWidth: "110dp",
      minHeight: "110dp",
      targetCellWidth: 2,
      targetCellHeight: 2,
      description: "[Experimental] Quick access to your media controls.",
      previewImage: "./assets/widget/now-playing.png",
    },
    {
      name: "ResizableNowPlaying",
      label: "🧪 Now Playing",
      minWidth: "250dp",
      minHeight: "110dp",
      targetCellWidth: 4,
      targetCellHeight: 2,
      description: "[Experimental] Quick access to your media controls.",
      previewImage: "./assets/widget/resizable-now-playing.png",
      resizeMode: "horizontal",
    },
  ],
};
//#endregion

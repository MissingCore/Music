import type { ExpoConfig } from "expo/config";
import type { WithAndroidWidgetsParams } from "react-native-android-widget";

const widgetConfig: WithAndroidWidgetsParams = {
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

export default (): ExpoConfig => ({
  name: "Music",
  slug: "Music",
  description: "A Nothing inspired music player.",
  version: "2.6.1",
  platforms: ["android"],
  githubUrl: "https://github.com/MissingCore/Music",
  orientation: "portrait",
  primaryColor: "#C8102E",
  icon: "./assets/icon.png",
  scheme: ["com.cyanchill.missingcore.music"],
  backgroundColor: "#F2F2F2",
  userInterfaceStyle: "automatic",
  assetBundlePatterns: ["**/*"],
  android: {
    package: "com.cyanchill.missingcore.music",
    versionCode: 1039,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      monochromeImage: "./assets/adaptive-icon-monochrome.png",
      backgroundColor: "#FFFFFF",
    },
    blockedPermissions: [
      // Optional permissions that Expo adds.
      "android.permission.VIBRATE",
      // From `expo-image-picker`.
      "android.permission.CAMERA",
      // From `expo-media-library`.
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
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
    [
      "react-native-bootsplash",
      {
        assetsDir: "assets/bootsplash",
        android: { parentTheme: "EdgeToEdge" },
      },
    ],
    [
      "react-native-edge-to-edge",
      { android: { enforceNavigationBarContrast: false } },
    ],
    ["react-native-android-widget", widgetConfig],
  ],
  newArchEnabled: false,
});

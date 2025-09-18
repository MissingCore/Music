import type { ExpoConfig } from "expo/config";

export default (): ExpoConfig => ({
  name: "Music",
  slug: "Music",
  description: "A Nothing inspired music player.",
  version: "2.5.2",
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
    versionCode: 1034,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      monochromeImage: "./assets/adaptive-icon-monochrome.png",
      backgroundColor: "#000000",
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
    "expo-router",
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
  ],
  newArchEnabled: false,
  experiments: {
    typedRoutes: true,
  },
});

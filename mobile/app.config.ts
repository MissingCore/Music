import type { ExpoConfig } from "expo/config";

export default (): ExpoConfig => ({
  name: "Music",
  slug: "Music",
  description: "A Nothing inspired music player.",
  version: "2.0.0-rc.3",
  platforms: ["android"],
  githubUrl: "https://github.com/MissingCore/Music",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "music",
  backgroundColor: "#F2F2F2",
  userInterfaceStyle: "automatic",
  assetBundlePatterns: ["**/*"],
  android: {
    package: "com.cyanchill.missingcore.music",
    versionCode: 1002,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      monochromeImage: "./assets/adaptive-icon-monochrome.png",
      backgroundColor: "#000000",
    },
    blockedPermissions: [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.VIBRATE",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
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
          "assets/fonts/Ndot-77_JP_Extended.ttf",
          "assets/fonts/NType82-Headline.otf",
        ],
      },
    ],
    [
      "react-native-bootsplash",
      {
        assetsDir: "assets/bootsplash",
        android: { parentTheme: "EdgeToEdge" },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});

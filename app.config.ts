import type { ExpoConfig } from "expo/config";

export default (): ExpoConfig => ({
  name: "Music",
  slug: "Music",
  description: "A Nothing inspired music player.",
  version: "0.0.0",
  platforms: ["android"],
  githubUrl: "https://github.com/MissingCore/Music",
  orientation: "portrait",
  icon: "./src/assets/images/icon.png",
  scheme: "music",
  backgroundColor: "#000000",
  userInterfaceStyle: "automatic",
  assetBundlePatterns: ["**/*"],
  android: {
    package: "com.cyanchill.missingcore.music",
    versionCode: 0, // Shouldn't be `0`, but will get overridden w/ our workflow.
    adaptiveIcon: {
      foregroundImage: "./src/assets/images/adaptive-icon.png",
      monochromeImage: "./src/assets/images/adaptive-icon-monochrome.png",
      backgroundColor: "#000000",
    },
    blockedPermissions: [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
    ],
  },
  plugins: [
    "expo-router",
    "expo-font",
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

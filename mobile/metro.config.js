// Learn more https://docs.expo.io/guides/customizing-metro
const { withUniwindConfig } = require("uniwind/metro");
const { withNanoIcons } = require("react-native-nano-icons/metro");

/** @type {import('expo/metro-config').MetroConfig} */
let config = null;

if (process.env.EXPO_PUBLIC_WITH_SENTRY === "true") {
  const { getSentryExpoConfig } = require("@sentry/react-native/metro", {
    includeWebReplay: false,
    includeWebFeedback: false,
  });
  config = getSentryExpoConfig(__dirname);
} else {
  const { getDefaultConfig } = require("expo/metro-config");
  config = getDefaultConfig(__dirname);
}

config.resolver.sourceExts.push("sql");

module.exports = withUniwindConfig(withNanoIcons(config), {
  cssEntryFile: "./src/global.css",
  extraThemes: ["custom", "atmosphere"],
});

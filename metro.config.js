// Learn more https://docs.expo.io/guides/customizing-metro
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { withNativeWind } = require("nativewind/metro");

const config = getSentryExpoConfig(__dirname);

config.resolver.sourceExts.push("sql");

module.exports = withNativeWind(config, {
  input: "./src/assets/global.css",
  configPath: "./tailwind.config.ts",
  inlineRem: false,
});

module.exports = function (api) {
  api.cache(true);
  return {
    env: {
      production: {
        plugins: ["transform-remove-console"],
      },
    },
    presets: ["babel-preset-expo"],
    plugins: [
      ["inline-import", { extensions: [".sql"] }],
      "react-native-worklets/plugin",
    ],
  };
};

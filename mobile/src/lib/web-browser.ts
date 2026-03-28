import { openBrowserAsync } from "expo-web-browser";

import { APP_VERSION } from "~/constants/Config";

//#region Constants
const GITHUB = "https://github.com/MissingCore/Music";

function getReleaseNotesLink(version: string) {
  return `${GITHUB}/releases/tag/${version}`;
}

export const Links = {
  GitHub: GITHUB,
  PlayStore:
    "https://play.google.com/store/apps/details?id=com.cyanchill.missingcore.music",
  CurrentRelease: getReleaseNotesLink(APP_VERSION),
  SpecificRelease: (version: string) => getReleaseNotesLink(version),
  Issues: `${GITHUB}/issues`,
  License: `${GITHUB}?tab=readme-ov-file#legal`,
  PrivacyPolicy: "https://missingcore.vercel.app/music/privacy-policy",
  Translations: "https://crowdin.com/project/missingcore-music",
  AndroidAuto: `${GITHUB}/blob/dev/docs/android-auto.md`,
};
//#endregion

export async function openLink(url: string) {
  //? Set `createTask = false` as otherwise, it creates a new task.
  //?   - Ref: https://github.com/expo/expo/pull/41457
  return openBrowserAsync(url, { createTask: false });
}

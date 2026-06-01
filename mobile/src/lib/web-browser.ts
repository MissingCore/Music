import { Linking } from "react-native";

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
  LyricsProviders: `${GITHUB}/blob/dev/docs/lyrics.md#-experimental-lyric-providers`,
};
//#endregion

/** Opens link in device's default browser. */
export async function openLink(url: string) {
  return Linking.openURL(url);
}

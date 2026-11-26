// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";

import { DISTRIBUTION } from "~/env";
import { usePreferenceStore } from "~/stores/Preference/store";

import { APP_VERSION } from "~/constants/Config";

type UpdateResult =
  | { hasNewUpdate: false; release: null }
  | { hasNewUpdate: true; release: { releaseNotes: string; version: string } };

/** Determines if we have a new update. */
export function useHasNewUpdate(): UpdateResult {
  const { isPending, error, data } = useLatestRelease();
  const rcNotification = usePreferenceStore((s) => s.rcNotification);

  if (isPending || !!error) return { hasNewUpdate: false, release: null };

  let usedRelease = data.latestStable;
  if (APP_VERSION.includes("-rc") || rcNotification) {
    if (
      DISTRIBUTION === "apk" ||
      !data.latestRelease.flags?.includes("hide-google-play")
    ) {
      //? Display latest release if we've installed the app via GitHub or
      //? the release is available on the "Open Testing" track on Google Play
      //? (via the lack of the `hide-google-play`) flag.
      usedRelease = data.latestRelease;
    } else if (isInstalledAppVersionNewer(data.latestStable.version)) {
      //? The installed version is newer than the latest stable, so don't
      //? display any release notes.
      return { hasNewUpdate: false, release: null };
    }
  }

  //? Introduced in `v3.6.0`, we may include a flag in the release notes
  //? to hide the release notification for Google Play releases as we wait
  //? for it to get reviewed.
  const hideRelease =
    DISTRIBUTION === "google-play" &&
    usedRelease.flags?.includes("hide-google-play");

  // Note: We can technically display an older release note if we updated
  // to the lastest version before the GitHub release notes are published.
  if (
    hideRelease ||
    !usedRelease.releaseNotes ||
    usedRelease.version === APP_VERSION
  ) {
    return { hasNewUpdate: false, release: null };
  } else {
    return { hasNewUpdate: true, release: usedRelease };
  }
}

//#region Data Query
async function getLatestRelease() {
  return {
    latestStable: await fetch(`${RELEASE_NOTES_LINK}/latest`)
      .then((res) => res.json())
      .then((data) => formatGitHubRelease(data)),
    latestRelease: await fetch(`${RELEASE_NOTES_LINK}?per_page=1`)
      .then((res) => res.json())
      .then(([data]) => formatGitHubRelease(data)),
  };
}

const queryKey = ["settings", "release-notes"];

function useLatestRelease() {
  const checkForUpdates = usePreferenceStore((s) => s.checkForUpdates);
  return useQuery({
    queryKey,
    queryFn: getLatestRelease,
    enabled: checkForUpdates,
    gcTime: Infinity,
    retry: false,
  });
}
//#endregion

//#region Internal Utils
const RELEASE_NOTES_LINK =
  "https://api.github.com/repos/MissingCore/Music/releases";

type ReleaseNotes = { version: string } & (
  | { releaseNotes: string; flags: string[] }
  | { releaseNotes: undefined; flags: undefined }
);

const CommentBodyRegex = /<!--([\s\S]*?)(?:-->)/g;

type GitHubReleaseSchema = { tag_name: string; body: string | null };

/** Formats the data returned from the GitHub API. */
function formatGitHubRelease({
  tag_name,
  body,
}: GitHubReleaseSchema): ReleaseNotes {
  if (!body)
    return { version: tag_name, releaseNotes: undefined, flags: undefined };

  return {
    version: tag_name,
    releaseNotes: body.replace(CommentBodyRegex, ""),
    flags: Array.from(body.matchAll(CommentBodyRegex), ([_, commentBody]) =>
      commentBody?.trim(),
    )
      .flatMap((commentBody) =>
        commentBody?.split(/\r?\n/).map((val) => {
          const trimmedVal = val.trim();
          if (!trimmedVal.startsWith("flag:")) return undefined;
          return trimmedVal.replace("flag:", "").trim();
        }),
      )
      .filter((val) => val !== undefined),
  };
}

function getSemVerNumber(version: string) {
  return version.replace(/^v/, "").split(/[.-]/).slice(0, 3).map(Number);
}

/**
 * See if the installed app is newer than the specified version based on
 * its major, minor, and patch versions.
 */
function isInstalledAppVersionNewer(version: string): boolean {
  const appVersionParts = getSemVerNumber(APP_VERSION);
  const versionParts = getSemVerNumber(version);

  const firstDifference = appVersionParts.findIndex(
    (part, index) => part !== versionParts[index],
  );
  if (firstDifference === -1) return false; //? Versions are the "same".

  return appVersionParts[firstDifference]! > versionParts[firstDifference]!;
}
//#endregion

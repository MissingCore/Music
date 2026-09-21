// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";

import { DISTRIBUTION } from "~/env";
import { usePreferenceStore } from "~/stores/Preference/store";

import { APP_VERSION } from "~/constants/Config";

type UpdateResult =
  | { hasNewUpdate: false; release: null; isRC: false }
  | {
      hasNewUpdate: true;
      release: { releaseNotes: string; version: string };
      isRC: boolean;
    };

/** Determines if we have a new update. */
export function useHasNewUpdate(): UpdateResult {
  const { isPending, error, data } = useLatestRelease();
  const rcNotification = usePreferenceStore((s) => s.rcNotification);

  let isRC = false;
  if (isPending || !!error) return { hasNewUpdate: false, release: null, isRC };

  isRC = APP_VERSION.includes("-rc");
  // Release candidates shouldn't have the "Latest Release" tag on GitHub
  // (ie: shouldn't be in `data.latestStable`). We compare against potentially
  // release candidate versions if we're on a release candidate.
  const usedRelease =
    isRC || rcNotification ? data.latestRelease : data.latestStable;

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
    !usedRelease.version ||
    usedRelease.version === APP_VERSION
  ) {
    return { hasNewUpdate: false, release: null, isRC: false };
  } else {
    return {
      hasNewUpdate: true,
      release: usedRelease,
      isRC: isRC || usedRelease.version.includes("-rc"),
    };
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

type ReleaseNotes =
  | { releaseNotes: undefined; version: undefined; flags: undefined }
  | { releaseNotes: string; version: string; flags: string[] };

const CommentBodyRegex = /<!--([\s\S]*?)(?:-->)/g;

/** Formats the data returned from the GitHub API. */
function formatGitHubRelease(data: any): ReleaseNotes {
  let releaseNotes: string | undefined;
  let flags: string[] | undefined;
  if (data.body) {
    releaseNotes = data.body.replace(CommentBodyRegex, "");
    flags = Array.from(
      (data.body as string).matchAll(CommentBodyRegex),
      ([_, commentBody]) => commentBody?.trim(),
    )
      .flatMap((commentBody) => {
        if (commentBody === undefined) return undefined;
        return commentBody.split(/\r?\n/).map((val) => {
          if (val.startsWith("flag:")) return val.split("flag:")[1];
          return undefined;
        });
      })
      .filter((val) => val !== undefined);
  }

  return { version: data.tag_name, releaseNotes, flags } as ReleaseNotes;
}
//#endregion

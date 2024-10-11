import { useQuery } from "@tanstack/react-query";

import { settingKeys } from "@/constants/QueryKeys";

import { APP_VERSION } from "@/constants/Config";

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

  let isRC = false;
  if (isPending || !!error) return { hasNewUpdate: false, release: null, isRC };

  isRC = APP_VERSION.includes("-rc");
  // Release candidates shouldn't have the "Latest Release" tag on GitHub
  // (ie: shouldn't be in `data.latestStable`). We compare against potentially
  // release candidate versions if we're on a release candidate.
  const usedRelease = isRC ? data.latestRelease : data.latestStable;

  // Note: We can technically display an older release note if we updated
  // to the lastest version before the GitHub release notes are published.
  if (!usedRelease.version || usedRelease.version === APP_VERSION) {
    return { hasNewUpdate: false, release: null, isRC: false };
  } else {
    return { hasNewUpdate: true, release: usedRelease, isRC };
  }
}

//#region Data
const RELEASE_NOTES_LINK =
  "https://api.github.com/repos/MissingCore/Music/releases";

type ReleaseNotes =
  | { releaseNotes: undefined; version: undefined }
  | { releaseNotes: string; version: string };

function formatGitHubRelease(data: any): ReleaseNotes {
  return {
    version: data.tag_name,
    // Remove markdown comments w/ regex.
    releaseNotes: data.body
      ? data.body.replace(/<!--[\s\S]*?(?:-->)/g, "")
      : undefined,
  } satisfies ReleaseNotes;
}

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

/** Returns the latest releases. */
const useLatestRelease = () =>
  useQuery({
    queryKey: settingKeys.release(),
    queryFn: getLatestRelease,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
//#endregion

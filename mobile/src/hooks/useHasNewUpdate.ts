import { useLatestRelease } from "@/features/setting/api/release";

import { APP_VERSION } from "@/constants/Config";

type UpdateResult =
  | { hasNewUpdate: false; release: null }
  | { hasNewUpdate: true; release: { releaseNotes: string; version: string } };

/** Determines if we have a new update. */
export function useHasNewUpdate(): UpdateResult {
  const { isPending, error, data } = useLatestRelease();

  if (isPending || !!error) return { hasNewUpdate: false, release: null };

  const usingRC = APP_VERSION.includes("-rc");
  // Release candidates shouldn't have the "Latest Release" tag on GitHub
  // (ie: shouldn't be in `data.latestStable`). We compare against potentially
  // release candidate versions if we're on a release candidate.
  const usedRelease = usingRC ? data.latestRelease : data.latestStable;

  // Note: We can technically display an older release note if we updated
  // to the lastest version before the GitHub release notes are published.
  if (!usedRelease.version || usedRelease.version === APP_VERSION) {
    return { hasNewUpdate: false, release: null };
  } else {
    return { hasNewUpdate: true, release: usedRelease };
  }
}

import { useQuery } from "@tanstack/react-query";

const RELEASE_NOTES_LINK =
  "https://api.github.com/repos/MissingCore/Music/releases/latest";

type ReleaseNotes =
  | { releaseNotes: undefined; version: undefined }
  | { releaseNotes: string; version: string };

export async function getLatestRelease() {
  return fetch(RELEASE_NOTES_LINK)
    .then((res) => res.json())
    .then(
      (data) =>
        ({
          version: data.tag_name,
          // Remove markdown comments w/ regex.
          releaseNotes: data.body
            ? data.body.replace(/<!--[\s\S]*?(?:-->)/g, "")
            : undefined,
        }) as ReleaseNotes,
    );
}

/** @description Check on the latest release. */
export const useLatestRelease = () =>
  useQuery({
    queryKey: [{ entity: "releases" }],
    queryFn: getLatestRelease,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
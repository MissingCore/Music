import { getActualPath } from "@missingcore/react-native-actual-path";

import { db } from "~/db";

import { playFromMediaList } from "~/modules/media/services/Playback";

import { addTrailingSlash } from "~/utils/string";

type Props = {
  path: string;
  initial: boolean;
};

/**
 * `expo-router`'s way of handling deep links. In our case, we can use it
 * to handle:
 *  - Opening the app via the media notification if the app was dismissed.
 *    - If we click on the media notification while the app is open, we
 *    get `initial = false`.
 *  - Opening the app via "Open With".
 *
 * @see https://docs.expo.dev/router/advanced/native-intent/
 */
export async function redirectSystemPath({ path, initial }: Props) {
  try {
    // Handle if we open from a `content://` uri.
    if (path.startsWith("content://")) {
      const track = await getTrackFromContentPath(path);

      if (track) {
        await playFromMediaList({
          source: {
            type: "folder",
            // Remove the `file:///` at the front of the uri.
            id: addTrailingSlash(track.parentFolder!.slice(8)),
          },
          trackId: track.id,
        });
      }

      return "/";
    }

    if (initial) {
      // Handle when we click on the player notification when we don't have
      // the app opened.
      if (path === "trackplayer://notification.click") {
        return "/";
      }

      return path;
    }
    return path;
  } catch {
    // Do not crash inside this function! Instead you should redirect users
    // to a custom route to handle unexpected errors, where they are able to report the incident
    return path;
  }
}

/** Get the track that we used "Open With" on. */
async function getTrackFromContentPath(path: string) {
  // 1. See if file uri is part of `path` (after removing `content://`).
  const [_referrer, ...uriSegments] = path.slice(10).split("/");
  const track = await db.query.tracks.findFirst({
    where: (fields, { and, eq, isNull }) =>
      and(
        eq(fields.uri, `file:///${uriSegments.join("/")}`),
        isNull(fields.hiddenAt),
      ),
  });
  if (track) return track;

  // 2. Get track from file uri derived from content uri.
  const derivedPath = await getActualPath(path);
  if (!derivedPath) return;
  return await db.query.tracks.findFirst({
    where: (fields, { and, eq, isNull }) =>
      and(eq(fields.uri, `file://${derivedPath}`), isNull(fields.hiddenAt)),
  });
}

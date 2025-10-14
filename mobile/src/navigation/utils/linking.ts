import { getActualPath } from "@missingcore/react-native-actual-path";
import type { LinkingOptions, ParamListBase } from "@react-navigation/native";
import { Linking } from "react-native";

import { db } from "~/db";

import { playFromList } from "~/stores/Playback/actions";

import { addTrailingSlash } from "~/utils/string";

let handledInitialURL = false;

export const linking: LinkingOptions<ParamListBase> = {
  prefixes: ["music://"],

  subscribe(listener) {
    // Handle the deep link used to open the app.
    if (!handledInitialURL) {
      Linking.getInitialURL()
        .then(handleContentURL)
        .then((isContentURL) => {
          if (isContentURL) listener("music://now-playing");
        });

      handledInitialURL = true;
    }

    // Handle any incoming deep links while the app has been opened.
    const subscription = Linking.addEventListener("url", async ({ url }) => {
      if (
        url === "trackplayer://notification.click" ||
        (await handleContentURL(url))
      ) {
        listener("music://now-playing");
      } else {
        listener(url);
      }
    });

    return () => subscription.remove();
  },
};

//#region Utils
/** See if the deep link is a `content://` URL and handle it accordingly. */
async function handleContentURL(url: string | null) {
  if (!url || !url.startsWith("content://")) return false;
  try {
    const track = await getTrackFromContentPath(url);

    if (track) {
      await playFromList({
        source: {
          type: "folder",
          // Remove the `file:///` at the front of the uri.
          id: addTrailingSlash(track.parentFolder!.slice(8)),
        },
        trackId: track.id,
      });

      return true;
    }
  } catch {}
  return false;
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
//#endregion

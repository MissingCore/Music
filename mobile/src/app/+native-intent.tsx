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

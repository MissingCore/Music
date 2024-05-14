import { Redirect } from "expo-router";

/**
 * @description Screen if we click the player notification when we don't
 *  have the app opened.
 */
export default function PlayerNotificationClicked() {
  return <Redirect href="/" />;
}

# Widgets

> [!IMPORTANT]  
> Widgets are an experimental feature and as such, may not get official support or work as expected.

These widgets are made through the awesome [`react-native-android-widget` package by Stefan Aleksovski](https://github.com/sAleksovski/react-native-android-widget).

Widget design is pretty limited as we have to account for the different Android versions and home screen layouts. For example, a `1×1` area on the home screen might not necessarily be a square.

> [!NOTE]  
> For the best experience, it's recommended to enable the `Continue Playback on Dismiss` experimental feature as well. Otherwise, when you dismiss the app, clicking on the widget (should) open the app instead of their expected behavior.

## Current Widgets

### Artwork Player

<img src="../mobile/assets/widget/artwork-player.png" alt="Artwork Player widget preview image" height="128" width="128" />

Displays the current playing track artwork. Clicking on the widget will play/pause the current track.

- If no track is queued / the app has been dismissed when `Continue Playback on Dismiss` is disabled, the app will be opened instead.

## Known Issues

- The widget when placed might be initially invisible (launching the app at least once should fix it).
- Dismissing the app (with `Continue Playback on Dismiss` disabled) then immediately clicking the widget will "crash" the app (you get the app launch notification, then it closes).
  - This is probably due to us delaying destroying the foreground service by `1s` to let the widget get updated one final time.

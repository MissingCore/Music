# Features

> [!NOTE]
> Incomplete documentation of the "stable" features the app offers.

## (Local) Track Metadata Editor

The pencil icon in the track sheet will bring you to a screen where you can modify the **local** metadata of the file. We specify **local** as:

- The file itself isn't modified, just the database entry used to cache the track's metadata.

> [!IMPORTANT]
> **To preserve these manual changes, rescans of either forms will not update the stored metadata even if the embedded metadata changed. To use the latest embedded metadata, you would need to use the "Reset" button in the "Edit Metadata" screen for that track.**

## Continue Playback on Dismiss

This enables playback to continue after removing the app from "Recent Tasks".

> [!NOTE]
> You may need to force-stop the app to stop playback in the situation where the media notification disappears when this experimental feature is enabled.
>
> Though, if you are using the experimental widgets, you can access the play/pause/prev/next controls from there.

## Multi-Select

We support a range of multi-select actions when long-pressing on a track for `~0.5s`:

- `Favorite/Unfavorite` (not available on "Favorite Tracks" playlist screen)
- `Add Selected To Playlists` (not available on "Current Playlist" screens)
- `Create & Add To Playlist` (not available on "Current Playlist" screens)
- `Remove From Playlist` (only available on "Current Playlist" screens)
- `Hide Selected`

Multi-select is only supported on the following screens:

- `Recently Played`
- `Folders`
- `Tracks`
- `Current Album/Artist/Genre/Playlist`

The multi-select menu will automatically be closed in the following situations:

- Having no tracks selected.
- Using a "back" action (gesture or button).
- Switching to a different screen.
  - Switching between folders is the exception, unless you use the "back" action to go to the previous folder.
- Clicking the `x` next to the selection count indicator.
- After closing the `Add Selected To Playlists` sheet.
- After successfully using `Create & Add To Playlist`, `Remove From Playlist`, or `Hide Selected` options.

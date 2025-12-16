# Supported Gestures

This document aims to document any gesture behavior/interactions that this app includes.

## Swipe for Actions

This involves swiping left on some content to reveal actions related to that content. It's currently present in the following features.

- **`Home Navigation`:** You can swipe on the home screen to navigate through the 6 different screens instead of using the navigation bar.
- **`Upcoming List`:** You can swipe left `175px` or halfway (whichever is smaller) on tracks (excluding the playing track) to remove it from the list.
- **`Playlist Tracks`:** You can swipe left `175px` or halfway (whichever is smaller) on tracks in the playlist modification screen (create or edit) to remove it from that playlist.
- **`Miniplayer`:** Given miniplayer gestures are enabled, swiping on the **text** portion left/right will play the next/prev track.

## Long-Press for Action

This involves long-pressing an item to reveal some action. It's currently present in the following features.

- **`Playlist Tracks`:** You can long-press on tracks in the playlist modification screen (create or edit) to change its order/position in the playlist.
- **`Upcoming List`:** You can long-press on tracks in the Upcoming screen to move their position in the queue.

## Drag for Action

This involves dragging an item to do some action. It's currently present in the following features.

- **`Now Playing Vinyl`:** You can drag your finger in a circular motion on the vinyl (when enabled) to have it act as a seekbar. 1 full rotation of the vinyl is equivalent to 24s.
- **`Nothing-Styled Scrollbar`:** You can drag the scrollbar (currently only available on the Home screens) to quickly scroll through the screen. Do note that some content might not be rendered immediately.

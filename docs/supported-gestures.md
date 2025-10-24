# Supported Gestures

This document aims to document any gesture behavior/interactions that this app includes.

## Swipe for Actions

This involves swiping left on some content to reveal actions related to that content. It's currently present in the following features.

- **`Home Navigation`:** You can swipe on the home screen to navigate through the 6 different screens instead of using the navigation bar.
- **`Filter List Entries`:** You can swipe left `125px` or halfway (whichever is smaller) to delete the filter in the allowlist or blocklist filter.
- **`Upcoming List`:** You can swipe left `125px` or halfway (whichever is smaller) on tracks (excluding the playing track) to remove it from the list.
- **`Playlist Tracks`:** You can swipe left `125px` or halfway (whichever is smaller) on tracks in the playlist modification screen (create or edit) to remove it from that playlist.
- **`Miniplayer`:** Given miniplayer gestures are enabled, swiping on the **text** portion left/right will play the next/prev track.

<table>
  <thead>
    <tr>
      <th align="center"><code>Home Navigation</code></th>
      <th align="center"><code>Filter List Entries</code></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center">
        <img src="./assets/supported-gestures/home-gestures.gif" alt="Swipe gesture on home screen as a form of navigation." width="200" />
      </td>
      <td align="center">
        <img src="./assets/supported-gestures/filter-list-gestures.gif" alt="Swipe gesture on allowlist filter to reveal delete button." width="200" />
      </td>
    </tr>
  </tbody>
</table>

## Long-Press for Action

This involves long-pressing an item to reveal some action. It's currently present in the following features.

- **`Playlist Tracks`:** You can long-press on tracks in the playlist modification screen (create or edit) to change its order/position in the playlist.

## Drag for Action

This involves dragging an item to do some action. It's currently present in the following features.

- **`Now Playing Vinyl`:** You can drag your finger in a circular motion on the vinyl (when enabled) to have it act as a seekbar. 1 full rotation of the vinyl is equivalent to 24s.

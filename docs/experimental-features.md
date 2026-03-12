# 🧪 Experimental Features

Most experimental features require you to enable it in the "Experimental Features" screen (`Settings > Experimental Features`).

## Glyph Toy

[Documentation can be found in the dedicated `music-glyph-toys` repository](https://github.com/MissingCore/music-glyph-toys?tab=readme-ov-file#toy-design--usage), with notes on the interaction support we added to simulate media controls via the Glyph Button.

> [!IMPORTANT]
> There's a high probability of the Glyph Button interactions not working since I don't have a Nothing Phone 3 to test things out (which might be caused by the connection between the toy and the app not being correctly implemented).

## M3U Files

> No Toggle Required.

We support importing & exporting M3U files. They can be imported in the "Create Playlist" screen and exported from the "Current Playlist" screen.

For importing M3U files:

- We support absolute paths given they are for the current device.
- We support relative paths.
- We **DO NOT** support M3U files that link to other M3U files.

For exporting M3U files:

- We support absolute paths (ie: `/storage/emulated/0/...`).
- We support relative paths (relative to where we want to save the file).

## Queue-Aware Play Next

When using the "Play Next" feature, we attempt to add those track(s) after the previously "Play Next" tracks.

> [!NOTE]
> This queue awareness is only for the given app session.

There are situations where the queue awareness will get reset:

- Toggling this experimental feature.
- Playing the previous track.
- Shuffling/unshuffling the list.
- Switching lists or resynchronizing the current one.
- A track getting removed from the queue via DB cleanup, error, or hiding the track.
- Moving a track outside of the "Play Next" range to inside the range.
- Playing a track outside of the "Play Next" range.
- Playing a track via the screen containing the original list.

## Sleep Timer

> No Toggle Required.

The Sleep Timer experimental features can be found on the "Now Playing" screen.

It enables you to automatically stop playback after the specified number of minutes. You can optionally delay the completion of the timer until the final track finishes.

## Smooth Playback Transition

> **Enabled by default.**

This makes it so that we flow into the next track seamlessly after the current track finishes, restoring pre-v2.7.0 behavior. **This will be removed in the future once we deem it to be stable.**

## Waveform Slider

This switches the seekbar on the "Now Playing" screen to a waveform of the current track. Since the waveform for a track gets cached after listening to it once while the feature is enabled, there is also the ability to clear all cached waveforms.

> [!NOTE]
> This may not work for certain file types.

## Widgets

See the [dedicated `Widgets` documentation for more information](./widgets.md).

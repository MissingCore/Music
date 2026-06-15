# 🧪 Experimental Features

Most experimental features require you to enable it in the "Experimental Features" screen (`Settings > Experimental Features`).

## Android Auto

See the [dedicated `Android Auto` documentation for more information](./android-auto.md).

## Downsample High Sample Rate Audio (192kHz+)

> **Enabled by default.**

This fixes [#138](https://github.com/MissingCore/Music/issues/138), an issue where high sample rate audio (`352.8kHz` & `384kHz`) cannot be played due to Exoplayer limitations, by downsampling the audio to `192kHz`. **This will be removed in the future once we deem it to be stable as we're currently unsure if there's any side-effects.**

## Equalizer

We support the default 5-band equalizer with 10 provided presets and the option to set a custom preset.

- Frequencies: 60Hz, 230Hz, 910Hz, 3.6kHz, and 14kHz
- Band Range: ± 10dB

> [!NOTE]
> Having this feature enabled may cause the app to feel slower (ie: slower navigation, slower opening of sheets).

## Lyric Providers

See the [dedicated `Lyrics Provider` documentation for more information](./lyrics.md#-experimental-lyrics-providers).

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

## MediaStore Scanner

This is an alternative method of extracting metadata for tracks, which is extremely fast since everything is already tracked in MediaStore's SQLite database. As such, **this requires Android 11+** to enable due to most of the fields being introduced in this version.

Although the MediaStore scanner is extremely fast, it has some problems. I've noticed that:

- The `year` field isn't returned for `.flac` files.
- If a track has no embedded `album` field, the name of the folder the track is in is returned instead (so all tracks will return a value in the `album` field).
- We've handled this internally, but if a track has a disc & track number, the value returned for the track number will incorporate both values (ie: `1002` for disc 1, track 2).

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

## ReplayGain

See the [dedicated `ReplayGain` documentation for more information](./replaygain.md).

## Sleep Timer

> No Toggle Required.

The Sleep Timer experimental features can be found on the "Now Playing" screen.

It enables you to automatically stop playback after the specified number of minutes. You can optionally delay the completion of the timer until the final track finishes.

## Waveform Slider

This switches the seekbar on the "Now Playing" screen to a waveform of the current track. Since the waveform for a track gets cached after listening to it once while the feature is enabled, there is also the ability to clear all cached waveforms.

> [!NOTE]
> This may not work for certain file types.

## Widgets

See the [dedicated `Widgets` documentation for more information](./widgets.md).

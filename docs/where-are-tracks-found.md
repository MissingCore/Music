# Where Are Tracks Found?

The default behavior of this app is to look for tracks in the top-level `Music` directory on every storage device found (ie: device storage, SD card). The rationale behind this is that in general, **you probably don't want the app to detect non-music audio files**, and the easiest way of doing this is to limit where we search to the `Music` directory on our device (where music should preferably be stored).

- This default was also chosen to potentially reduce the time spent on the loading screen if you do decide to stick to these defaults.

If you want to look for tracks elsewhere or if you don't want these defaults, you can do this simply by changing the directories we filter by (through the allowlist or blocklist) in the `Library` screen in the settings page.

<img src="./assets/where-are-tracks-found/editing_filters_location.png" alt="Visual guide of getting to the `Directory Filtering` feature." />

## Accuracy Issues

The `Find Directory` option for adding paths to the allowlist or blocklist is not the most accurate thing. This is mainly due to the way the paths to the directories are returned from the directory selector screen.

In technical terms, when we select a directory, it returns a `content://` URI, which is different from what we want, which is a `file://` URI. There's no easy way of converting a `content://` URI to a `file://` URI, so there has to be a bit of guessing.

- If the URI contains `/tree/primary:`, it generally refers to the device's main storage, which is `/storage/emulated/0`.
- For other patterns, it's not as clear. On OnePlus devices for example, they have a "Parallel App" feature, whose data is stored in `/storage/ace-999`, however, in the `content://` URI, we'll see `/tree/parallel:`.

It's impossible to keep track of these mappings with all the different manufactures and models out there.

For the best accuracy, you should find the URI of a file in the directory you want to add and write it in manually.

## Method of Getting Accurate URIs

This method takes a bit of work, but allows you to get the accurate URIs without having to hunt them down.

1. Remove all filters present in the `Library` screen in the settings page.
2. Re-launch the app so the app indexes all tracks found on the device.
3. Go through the `FOLDERS` tab and figure out what directories you want to allow or block.
4. When you find the directory you want to allow or block, look at the breadcrumbs to that directory, make note of it, and add it to the allowlist or blocklist.

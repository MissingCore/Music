# How Are Tracks Indexed?

The process of indexing tracks can be broken up in the following way:

1. Data Adjustments/Migrations.
2. Saving & Populating Tracks With Metadata.
3. Cleaning Up The Database.
4. Saving Track Artwork.
5. Cleaning Up Unused Images.

When opening the app for the first time, you may encounter the loading screen for a substantial amount of time. Since this can be considered as the app setup process, the time spent on this screen is negligible as this operation should only happen when we open the app for the first time or whenever we add new tracks (the time spent on the screen depends on the number of new tracks found).

## Data Adjustments/Migrations

Before we start looking for any tracks, we want to make sure that any existing data complies with any changes we made previously. This logic might be run when we update a schema.

We ran this logic in the past to fix existing data after we fixed the following issues or introduced new features:

- Album fracturization.
- Missing images.
- Tracks previously rejected due to its metadata not being supported.
- Generation of file tree for the "Folders" feature.

## Saving & Populating Tracks With Metadata

The first thing we do is figure out what tracks are on our device and keep the subset of tracks that we want (currently, only tracks in the top-level `Music` directory on each storage device/volume). We then go through a couple of tracks at a time, getting their metadata, and creating or updating a `Track` entry. If an error is thrown when retrieving the metadata, that track gets added to the `InvalidTrack` table.

## Cleaning Up The Database

After we finish saving or updating the metadata of tracks, we then remove any entries that may no longer be relevant.

- We remove any `Track` entries that we didn't find when getting the list of tracks found on the device.
- We remove any `Album` entries with no tracks.
- We remove any `Artist` entries with no albums & tracks.

If we discover any deleted tracks in the queue list or in the list of playing tracks, they will be removed.

## Saving Track Artwork

After we do the above tasks, we start saving the tracks in the background in an optimal manner. We go through each track, one-by-one and save the image from its metadata if the following conditions are satisfied:

1. The album it belongs to doesn't have any artwork associated with it.
2. The track doesn't belong to an album and has no artwork associated with it.

## Cleaning Up Unused Images

After we finish saving any new artwork, we then find artwork stored by this app that isn't being used and delete them. This is an effort to slim down the amount of storage this app takes up on your device.

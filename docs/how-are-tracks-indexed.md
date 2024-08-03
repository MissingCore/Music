# How are Tracks Indexed?

In this iteration of the app, we currently index tracks in different phases. The first phase would be considered "blocking" — as in, we don't let the user do anything while the phase is in progress. The remaining phases are done in the background, allowing the user to use the app (albeit, potentially with some slower interactions).

## "Blocking" Tasks

These tasks must be completed before the user is allowed to interact with the app. There is 3 main tasks:

1. Data adjustments / migrations.
2. Sparse track saving.
3. Database cleanup.

### Data Adjustments / Migrations

This portion of the code may change data in the database to trigger some other logic later on. Some examples of when this occurs is when we change a schema or fix some old logic, in which, we want to ensure the existing data is accurate and represents the same content as if we ran it through the app on fresh-install.

Some things we currently fix are:

- Album fracturization.
- Missing images.
- Tracks previously rejected due to reading its metadata not being supported.
- Generation of the file tree for the "Folders" feature.
- Migrating existing `Track` entries due to adding a new `fetchedMeta` field.

### Sparse Track Saving

This portion of the code finds what tracks are found on our device and filters them down to the ones we're interested in (currently, tracks in the top-level `Music` directory on each storage device/volume). After figuring out which tracks are new or modified, we create `Track` entries with the minimum amount of data needed (ie: without metadata).

### Database Cleanup

This portion of the code removes any unlinked content (ie: tracks that no longer exist, albums & artists with no tracks). When removing tracks, we also make sure we remove it from the queue and list of playing tracks.

## Background Tasks

These tasks are done while the user has access to the app's features. There are 3 main background tasks done in the following order:

1. Populating tracks with metadata.
2. Artwork saving.
3. Artwork cleanup.

### Populating Tracks with Metadata

This portion of the code goes through batches of tracks (currently `10` which doesn't hinder performance as much on older devices), fetches their metadata, and populates their database entry (creating the `Artist` or `Album` entries as needed).

### Artwork Saving

After we finish populating tracks with metadata, we go through each track, one-by-one and get the artwork from its metadata if necessary. We optimized the code such that this only occurs if:

1. The album it belongs to doesn't have any artwork currently.
2. The track doesn't belong to an album and doesn't have artwork.

### Artwork Cleanup

After we finish saving the artwork, we then find the artwork that isn't being used, which is stored by this app. This is an effort to slim down the amount of storage this app takes up on your device.

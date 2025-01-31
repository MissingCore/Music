# How Are Tracks Indexed?

This document aims to note the process that goes on when on the onboarding screen (ie: the screen with this app's icon).

When you open the app for the very first time, you'll encounter the loading screen for a substantial amount of time. This is considered the "onboarding" process, in which the app will search on your device all audio files and attempt to save its metadata into a database so that this information will be present to you instantaneously on future usage of the app. The time spent onboarding is negligible as this will only happen whenever you use the app for the first time or whenever you add new tracks, in which the duration spent correlates to the amount of tracks found.

Specifically, this onboarding process has 3 phases:

1. Preprocessing
2. Saving Track Metadata
3. Saving Track Artwork

## Preprocessing

The "preprocessing" phase of the onboarding process is when we run some code to update pre-existing data to ensure it works with any new features.

## Saving Track Metadata

> [!WARNING]  
> This process penalizes users with a lot of tracks as on every app launch, we need to determine which tracks are new or have been modified, which involves looking at every track on the device. As your library gets larger, the longer it takes for this process to finish.

This phase involves:

1. Finding all the "valid" tracks which are:
   - Tracks that are in the directories specified by the allowlist.
   - Tracks that are not in the directories specified by the blocklist.
   - Tracks that are longer than a specified duration.
2. Getting the metadata of any new or modified tracks and inserting or updating entries in the database.
3. Do any cleanup in the database.

> [!NOTE]  
> For new users to the app, the app will default to looking for music anywhere that is **longer than 15 seconds**.

## Saving Track Artwork

This phase involves going through every track that doesn't have artwork associated with it (ie: if it belongs to an album, it must not have artwork) and attempting to find it directly from its metadata. If image data is found:

- If the track belongs to an album, that image gets assigned to the album.
- Otherwise, the image gets assigned to the track.

> [!NOTE]  
> In v1, we did this in the background (so you could be interacting with the app in some other form). The problem was that it sometimes caused some weird bugs due to the laggy behavior it creates as all the system resources are involved in reading the artwork directly from the music file.

After we go through all unchecked tracks, we then look for and delete any image stored by the app that isn't associated with an album, playlist, or track (in order to slim down the amount of storage this app takes up on your device).

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project attempts to adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

The public release of `Music`, a Nothing inspired music player.

> This formatting is only for the first version of `Music` — proper "Keep a Changelog" formatting will follow after `Music`'s release.

### 🎉 Features

At launch, `Music` provides basic features such as:

1. Playing a track
2. Repeat & Shuffle
3. Creating playlists w/ the ability of customizing its artwork
4. Favoriting albums, playlists, and tracks
5. Playback in the background w/ media control notification

In addition, `Music` has:

1. Queue support
2. Displays the 10 recently played sources of music
3. Automatic saving of new tracks & cleanup

#### 📋 Queues

Have a track that pops up that you want to play next? Queues allows you to do this by adding tracks to a special list that "interrupts" the current track list by playing first. You want to jam to the same track over and over again — keep adding the track to the queue until you're satisfied.

#### ⌛ Recently Played

`Music` displays up to 10 recently played track sources on the homepage. This can help give you the idea of where your interest lies and indicate to you what albums or playlists you're no longer interested in.

#### 💾 Automatic Saving & Cleanup

On app launch, `Music` will look for any new tracks added to your device and save its information in the app's database. This allows for quicker access to information about the track throughout the app without needing to read the file directly.

In addition, `Music` will detect any tracks deleted and remove them from any playlists that contain it. If it was in an album or belongs to an artist with no tracks, those entities will automatically be removed from view.

`Music` aims to keep its size small and delete any unnecessary resources.

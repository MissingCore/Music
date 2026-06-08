# Lyrics

MissingCore Music supports displaying lyrics that are user-owned, locally stored, or served by a provider that explicitly grants the necessary rights. You are responsible for ensuring the provider permits use to third-party apps. That being said, here are the methods we use to "accept" lyrics:

1. Filling out a form, either by writing out the lyrics or importing a `.lrc` or `.txt` file containing the lyrics.
2. "Automatically" while on the "Now Playing" screen with "Lyrics" enabled.

For the "automatic" flow, we go through the following methods:

1.  Checking for embedded lyrics.
2.  Checking for adjacent `.lrc` files with the same name as the playing track (excluding the extension).
    - `.txt` files do not work due to security reasons (would be bad if an app can arbitrarily read `.txt` files on your device).
3.  Through **user-provided** lyrics providers.

If you see on the "Now Playing" screen, that the "Manage Lyrics" button is pressable, then it means that no lyrics were found via the "automatic" flow.

## [🧪 Experimental] Lyrics Providers

Lyrics providers are the only means of displaying lyrics from online sources. **It's important to note that it may take some time to display lyrics from the online source.**

> [!IMPORTANT]
> For legal reasons, we do not automatically provide online sources for displaying lyrics as we do not have a license for doing so.

### Creating a Lyrics Provider

Given you have a license to an API that distributes lyrics which can be displayed in this app, here are the components you need to provide to the form found in `Settings > Experimental Features > Lyrics Providers > +`.

- `Name`: A name for the lyric provider entry.
- `Endpoint`: The URL to the API endpoint. For the query parameters in the API endpoint, use the supported placeholder values (`%name%`, `%artistName%`, `%albumName%`, `%duration%`) as the value.

  ```
  https://www.example.com/api/get?artist_name=%artistName%&track_name=%name%&album_name=%albumName%&duration=%duration%
  ```

- `isJSONResponse`: Whether the response from the API endpoint is an array or object. If set to "false", then we assume the response is a string.
- `Headers`: A list of `Key: Value` pairs that needs to be attached to the query. For example:

  ```
  Authorization: Bearer ...
  X-API-Key: ...
  ```

- `Traversed Fields`: The list of object properties we need to go through to return lyrics. For example:

  ```
  // If the endpoint returned the following:
  [
    {
      "id": 123456,
      "name": "Track name",
      "trackName": "Track name",
      "artistName": "Artist name",
      "albumName": "Album name",
      "duration": 123,
      "lyrics": {
        "plain": "...",
        "synced": "..."
      }
    }
  ]

  // To get the lyrics, we would write down 2 entries in this exact order:
  lyrics
  synced
  ```

  - If `isJSONResponse` is "false", then this should be left empty as the response should be the lyrics themselves.

## Supported Lyric Formats

Lyrics will be rendered as a static string, unless it's identified as synchronized by the following conditions:

- Every line starts with `[mm:ss.ms]` or `[mm:ss]`.
  - Tags at the start of the lyrics that follow a similar format (ie: `[ti:]`) will be ignored.
- Word-by-word lyrics (using either square or angle brackets) are also supported (ie: `[mm:ss.ms]`, `<mm:ss.ms>`).

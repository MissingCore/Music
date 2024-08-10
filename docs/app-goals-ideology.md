# App Goals & Ideology

After thinking about it over a bit of what I want this app to be, I came up with the following points that I want the app to adhere to:

- Serverless — everything should be accomplished on-device.
- API Key-Free — everything used to add functionality should be free (and legal).
- Offline-First — `Music` was built to be a local music player and all features should work offline.
- Keep Things Legal — don't add things that might break some TOS will probably get this app nuked from the Play Store.

## What Will Not Be Added

With the above in mind, here is an (incomplete) **list of things we will not be adding to `Music`**.

### Spotify & YouTube Music Support

First of all, adding support for these music providers will add a lot of complexity, requires a server & API keys, and definitely won't work offline. With YouTube Music, there's no official API, and even if there is, it'll probably cost a bit (like with all of Google APIs). With Spotify, there's no streaming support unless you have a premium account (ie: with the API, you can only retrieve content metadata, which is useless).

In addition, there's also the legal stuff and whether the app will comply with their TOS which I don't want to deal with.

### Lyrics

Lyrics was something that I wanted to add to the app on its conceptualization. The more I went through the process of building this app and learning about the Google Play policy, the more I don't see this feature being possible.

The main issue pertains to Intellectual Property (IP for short). As some may know, music cover art and lyrics are both copyrighted material. The reason why services such as Genius and Spotify can display lyrics is due to having a license to do so:

- [Genius](https://genius.com/static/licensing)
- [Spotify](https://support.spotify.com/us/artists/article/lyrics/)

#### User-Provided Lyrics

I considered adding support for user-provided lyrics, but it's a bit complex to implement along with requiring those lyrics to conform to a certain format and file type.

### Tag Editor

Editing tags on a file is a more complex thing that it may seem. Figuring out how to implement one will probably take my sanity and will probably be half-baked. Tag editing should be done with dedicated apps.

### Other Things

You can refer to [this article by OxygenCobalt who made Auxio, an open-source media player](https://github.com/OxygenCobalt/Auxio/wiki/Why-Are-These-Features-Missing%3F) explaining why some features are missing from his app.

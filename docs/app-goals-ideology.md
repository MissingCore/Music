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

### Other Things

You can refer to [this article by OxygenCobalt who made Auxio, an open-source media player](https://github.com/OxygenCobalt/Auxio/wiki/Why-Are-These-Features-Missing%3F) explaining why some features are missing from his app.

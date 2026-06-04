# [🧪 Experimental] ReplayGain

MissingCore Music supports ReplayGain as an experimental feature. In addition, we support a pre-amp which gets applied when the feature is enabled.

ReplayGain is a feature which normalizes audio such that its perceived loudness hits `89 dB`. As such, enabling this feature may result in audio becoming quieter.

## How It Works

We calculate the ReplayGain value right before the track gets loaded into AudioBrowser. After identifying the track we want to load into AudioBrowser:

1. We get the embedded **track ReplayGain** value through the `getR128Gain()` function from our `@missingcore/react-native-metadata-retriever` package.
   - The operation is pretty fast, which allows us to do this live instead of needing to cache the value in the database.
2. We then add on the `ReplayGain Pre-amp` value to whatever we found.
   - We support 2 "Pre-amp" values, which get added based on if an embedded track ReplayGain value was found.
   - We can adjust the applied ReplayGain by `± 15 dB` with this feature.
3. We attach this value to the `Track` object which gets loaded into AudioBrowser.

Once the track is played, the ReplayGain value will be applied (given the `ReplayGain` feature is enabled).

- One potential side-effect is that you might hear a slight spike at the beginning if the ReplayGain isn't applied immediately.

> [!NOTE]
> As seen through our current methods, any changes to the `ReplayGain Pre-amp` values will only be applied onto the next played track.

## Supported ReplayGain Tags

We currently pull the ReplayGain value from the following tags: `ReplayGain Xing/Info`, `REPLAYGAIN_TRACK_GAIN`, and `R128_TRACK_GAIN`.

- Only `ReplayGain Xing/Info` & `REPLAYGAIN_TRACK_GAIN` have been validated on MP3 files.

> [!NOTE]
> If ReplayGain isn't working for a file, email it to `missingcoredev@outlook.com` and I'll investigate the tag that's being used and implement a fix.

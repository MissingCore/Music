# [🧪 Experimental] Android Auto

> [!IMPORTANT]
> I do not use Android Auto, so any bugs that occur will have a lower priority. In addition, we're not responsible for any jankiness that occurs when using this app with Android Auto.

Android Auto support will stay as an experimental feature for the foreseeable future. As such, there are some caveats you need to be aware of:

0. Currently, only "structured" lists (Albums & Playlists) can be played directly from the Android Auto interface.
   - Though, you can still play from other lists via the Android app and go through the tracks via the media controls on Android Auto.
1. Artwork will not get rendered (Android Auto doesn't work with embedded artwork).
2. Search & voice commands aren't implemented.
3. Shuffle & Repeat state can only be controlled via the Android app.

> [!NOTE]
> This app should work with Android Auto without any additional configurations. If it doesn't show up, you may need to [enable Developer Mode and allow "Unknown Sources"](https://developer.android.com/training/cars/testing#developer-mode).

## Developer Notes

Testing the app in Android Auto requires using the Desktop Head Unit (DHU) available in Android Studio.

0. [Enable Android Auto developer mode](https://developer.android.com/training/cars/testing#developer-mode).
1. [Installing the DHU](https://developer.android.com/training/cars/testing/dhu#install).
2. [Connecting to the DHU with device via USB](https://developer.android.com/training/cars/testing/dhu#connection-adb).

### Additional Notes For Adding Android Auto Support

- https://github.com/lovegaoshi/react-native-track-player/blob/APM/docs/docs/guides/android-auto.md#necessary-declarations

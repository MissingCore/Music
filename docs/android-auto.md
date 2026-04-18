# [🧪 Experimental] Android Auto

> [!IMPORTANT]
> I do not use Android Auto, so any bugs that occur will have a lower priority. In addition, we're not responsible for any jankiness that occurs when using this app with Android Auto.

Android Auto support will stay as an experimental feature for the foreseeable future. As such, there are some caveats you need to be aware of:

0. **Android Auto may not display all tracks (probably for safety to limit driver distraction)**.
1. Search & voice commands aren't implemented.
2. Shuffle & Repeat state can only be controlled via the Android app.
3. Changes made to any lists via the Android app may not immediately be reflected on the Android Auto interface. Relaunching the app will resynchronize the data.
   - This shouldn't necessarily be a problem as you shouldn't be changing any lists while driving.

> [!NOTE]
> This app should work with Android Auto without any additional configurations. If it doesn't show up, you may need to [enable Developer Mode and allow "Unknown Sources"](https://developer.android.com/training/cars/testing#developer-mode).

## Other Notes

- [Why EQ (when enabled) sounds bad on Android Auto.](https://www.reddit.com/r/Android/comments/1q8h1vm/im_an_android_audio_dev_here_is_why_your_global/)

# Developer Notes

Testing the app in Android Auto requires using the Desktop Head Unit (DHU) available in Android Studio.

0. [Enable Android Auto developer mode](https://developer.android.com/training/cars/testing#developer-mode).
1. [Installing the DHU](https://developer.android.com/training/cars/testing/dhu#install).
2. [Connecting to the DHU with device via USB](https://developer.android.com/training/cars/testing/dhu#connection-adb).

## Additional Notes For Adding Android Auto Support

- https://github.com/lovegaoshi/react-native-track-player/blob/APM/docs/docs/guides/android-auto.md#necessary-declarations

package expo.modules.nativeutils.media

import android.provider.MediaStore

val EXTERNAL_CONTENT_URI = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

/** Columns to give context about the file. */
val ASSET_PROJECTION = arrayOf(
  MediaStore.Audio.Media._ID,
  MediaStore.Audio.Media.DISPLAY_NAME,
  MediaStore.Audio.Media.DATA,
  MediaStore.Audio.Media.MIME_TYPE,
  MediaStore.Audio.Media.DATE_MODIFIED,
  MediaStore.Audio.Media.DURATION,
  MediaStore.Audio.Media.SIZE,
)

package expo.modules.nativeutils.media

import android.provider.MediaStore

val ARTIST_PLACEHOLDER = "<unknown>"

val EXTERNAL_CONTENT_URI = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

/** Columns to give context about the file. */
val ASSET_PROJECTION = arrayOf(
  MediaStore.Audio.Media._ID,
  MediaStore.Audio.Media.DISPLAY_NAME,
  MediaStore.Audio.Media.DATA,
  MediaStore.Audio.Media.MIME_TYPE,
  MediaStore.Audio.Media.DATE_ADDED,
  MediaStore.Audio.Media.DATE_MODIFIED,
  MediaStore.Audio.Media.DURATION,
)

/** Adds on audio metadata to the original projection. */
val AUDIO_ASSET_PROJECTION = arrayOf(
  *ASSET_PROJECTION,
  MediaStore.Audio.Media.TITLE,
  MediaStore.Audio.Media.ALBUM,
  MediaStore.Audio.Media.ALBUM_ARTIST,
  MediaStore.Audio.Media.ARTIST,
  MediaStore.Audio.Media.YEAR,
  MediaStore.Audio.Media.DISC_NUMBER,
  MediaStore.Audio.Media.TRACK,
  MediaStore.Audio.Media.BITRATE,
  MediaStore.Audio.Media.SIZE,
)

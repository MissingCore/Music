package expo.modules.nativeutils.media

import android.os.Build
import android.provider.MediaStore
import androidx.annotation.RequiresApi

val EXTERNAL_CONTENT_URI = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

/** Columns to give context about the file. */
val ASSET_PROJECTION = arrayOf(
  MediaStore.Audio.Media._ID,
  MediaStore.Audio.Media.DISPLAY_NAME,
  MediaStore.Audio.Media.DATA,
  MediaStore.Audio.Media.MIME_TYPE,
  MediaStore.Audio.Media.DATE_MODIFIED,
  // API docs mention that `DURATION` is only supported on API 29, but it's probably a mistake.
  MediaStore.Audio.Media.DURATION,
  MediaStore.Audio.Media.SIZE,
)

/** Placeholder value placed in artist field if no results are returned. */
@RequiresApi(Build.VERSION_CODES.R)
val ARTIST_PLACEHOLDER = "<unknown>"

/**
 * Adds on audio metadata to the original projection.
 *
 * Requires Android 11+ (API 30+).
 */
@RequiresApi(Build.VERSION_CODES.R)
val AUDIO_METADATA_ASSET_PROJECTION = arrayOf(
  *ASSET_PROJECTION,
  MediaStore.Audio.Media.TITLE,
  MediaStore.Audio.Media.ALBUM,
  MediaStore.Audio.Media.ALBUM_ARTIST,
  MediaStore.Audio.Media.ARTIST,
  MediaStore.Audio.Media.GENRE,
  MediaStore.Audio.Media.YEAR,
  MediaStore.Audio.Media.DISC_NUMBER,
  MediaStore.Audio.Media.TRACK,
  MediaStore.Audio.Media.BITRATE,
)

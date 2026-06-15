package expo.modules.nativeutils.media.assets

import android.database.Cursor
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import androidx.annotation.ChecksSdkIntAtLeast
import expo.modules.nativeutils.media.ARTIST_PLACEHOLDER

@ChecksSdkIntAtLeast(api=Build.VERSION_CODES.R)
fun isMetadataSupported(): Boolean {
  return Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
}

fun putAssetsInfo(
  cursor: Cursor,
  response: MutableList<Bundle>,
  limit: Int,
  offset: Int,
  returnWithMetadata: Boolean
) {
  val idIndex = cursor.getColumnIndex(MediaStore.Audio.Media._ID)
  val filenameIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DISPLAY_NAME)
  val localUriIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DATA)
  val mimeTypeIndex = cursor.getColumnIndex(MediaStore.Audio.Media.MIME_TYPE)
  val modificationDateIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DATE_MODIFIED)
  val durationIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DURATION)
  val sizeIndex = cursor.getColumnIndex(MediaStore.Audio.Media.SIZE)

  val returnMetadata = returnWithMetadata && isMetadataSupported()
  val titleIndex = if (returnMetadata) cursor.getColumnIndex(MediaStore.Audio.Media.TITLE) else -1
  val albumIndex = if (returnMetadata) cursor.getColumnIndex(MediaStore.Audio.Media.ALBUM) else -1
  val albumArtistIndex = if (returnMetadata) cursor.getColumnIndex(MediaStore.Audio.Media.ALBUM_ARTIST) else -1
  val artistIndex = if (returnMetadata) cursor.getColumnIndex(MediaStore.Audio.Media.ARTIST) else -1
  val genreIndex = if (returnMetadata) cursor.getColumnIndex(MediaStore.Audio.Media.GENRE) else -1
  val yearIndex = if (returnMetadata) cursor.getColumnIndex(MediaStore.Audio.Media.YEAR) else -1
  val discNumberIndex = if (returnMetadata) cursor.getColumnIndex(MediaStore.Audio.Media.DISC_NUMBER) else -1
  val trackNumberIndex = if (returnMetadata) cursor.getColumnIndex(MediaStore.Audio.Media.TRACK) else -1
  val bitrateIndex = if (returnMetadata) cursor.getColumnIndex(MediaStore.Audio.Media.BITRATE) else -1
  val sampleRateIndex = if (returnMetadata) cursor.getColumnIndex(MediaStore.Audio.Media.SAMPLERATE) else -1

  if (!cursor.moveToPosition(offset)) {
    return
  }
  var i = 0
  while (i < limit && !cursor.isAfterLast) {
    val assetId = cursor.getLong(idIndex)
    val path = cursor.getString(localUriIndex)
    val localUri = "file://$path"

    val asset = Bundle().apply {
      putString("id", assetId.toString())
      putString("filename", cursor.getString(filenameIndex))
      putString("uri", localUri)
      putString("mimeType", cursor.getString(mimeTypeIndex))
      putDouble("modificationTime", cursor.getLong(modificationDateIndex) * 1000.0)
      putDouble("duration", cursor.getLong(durationIndex) / 1000.0)
      putLong("fileSize", cursor.getLong(sizeIndex))
    }

    if (returnMetadata) {
      val assetMetadata = Bundle().apply {
        if (titleIndex != -1) putString("title", cursor.getString(titleIndex))
        if (albumIndex != -1) putString("album", cursor.getString(albumIndex))
        if (albumArtistIndex != -1) putString("albumArtist", cursor.getString(albumArtistIndex))
        if (artistIndex != -1) putString("artist", cursor.getString(artistIndex))
        if (genreIndex != -1) putString("genre", cursor.getString(genreIndex))
        if (yearIndex != -1) putInt("year", cursor.getInt(yearIndex))
        if (discNumberIndex != -1) putInt("discNumber", cursor.getInt(discNumberIndex))
        if (trackNumberIndex != -1) {
          val rawTrackNumber = cursor.getInt(trackNumberIndex)
          // `MediaStore.Audio.Media.TRACK` may contain information about both disc & track number.
          // For example, `1002` would indicate disc 1 & track 2.
          val trackNumber = if (rawTrackNumber >= 1000) rawTrackNumber % 1000 else rawTrackNumber
          putInt("trackNumber", trackNumber)
        }
        if (bitrateIndex != -1) putInt("bitrate", cursor.getInt(bitrateIndex))
        if (sizeIndex != -1) putLong("fileSize", cursor.getLong(sizeIndex))
        if (sampleRateIndex != -1) putInt("sampleRate", cursor.getInt(sampleRateIndex))
      }

      // Remove following values if `0`.
      if (assetMetadata.getInt("discNumber") == 0) assetMetadata.putString("discNumber", null)
      if (assetMetadata.getInt("trackNumber") == 0) assetMetadata.putString("trackNumber", null)
      if (assetMetadata.getInt("year") == 0) assetMetadata.putString("year", null)
      if (assetMetadata.getInt("sampleRate") == 0) assetMetadata.putString("sampleRate", null)

      // Remove placeholder set for artist.
      if (assetMetadata.getString("artist") == ARTIST_PLACEHOLDER) assetMetadata.putString("artist", null)

      // Have `albumArtist` fallback to `artist` if it's not defined, but only if `artist` & `album` are defined.
      if (
        assetMetadata.getString("albumArtist") == null &&
        assetMetadata.getString("artist") != null &&
        assetMetadata.getString("album") !== null
      ) {
        assetMetadata.putString("albumArtist", assetMetadata.getString("artist"))
      }

      asset.putBundle("metadata", assetMetadata)
    } else {
      asset.putString("metadata", null)
    }

    cursor.moveToNext()
    response.add(asset)
    i++
  }
}

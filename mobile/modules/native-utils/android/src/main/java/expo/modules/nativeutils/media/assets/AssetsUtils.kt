package expo.modules.nativeutils.media.assets

import android.content.Context
import android.database.Cursor
import android.os.Bundle
import android.provider.MediaStore
import expo.modules.nativeutils.media.ARTIST_PLACEHOLDER

fun putAssetsInfo(
  context: Context,
  cursor: Cursor,
  response: MutableList<Bundle>,
  limit: Int,
  offset: Int,
  resolveWithFullInfo: Boolean
) {
  val idIndex = cursor.getColumnIndex(MediaStore.Audio.Media._ID)
  val filenameIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DISPLAY_NAME)
  val localUriIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DATA)
  val mimeTypeIndex = cursor.getColumnIndex(MediaStore.Audio.Media.MIME_TYPE)
  val creationDateIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DATE_ADDED)
  val modificationDateIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DATE_MODIFIED)
  val durationIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DURATION)

  val titleIndex = if (resolveWithFullInfo) cursor.getColumnIndex(MediaStore.Audio.Media.TITLE) else -1
  val albumIndex = if (resolveWithFullInfo) cursor.getColumnIndex(MediaStore.Audio.Media.ALBUM) else -1
  val albumArtistIndex = if (resolveWithFullInfo) cursor.getColumnIndex(MediaStore.Audio.Media.ALBUM_ARTIST) else -1
  val artistIndex = if (resolveWithFullInfo) cursor.getColumnIndex(MediaStore.Audio.Media.ARTIST) else -1
  val yearIndex = if (resolveWithFullInfo) cursor.getColumnIndex(MediaStore.Audio.Media.YEAR) else -1
  val discNumberIndex = if (resolveWithFullInfo) cursor.getColumnIndex(MediaStore.Audio.Media.DISC_NUMBER) else -1
  val trackNumberIndex = if (resolveWithFullInfo) cursor.getColumnIndex(MediaStore.Audio.Media.TRACK) else -1
  val bitrateIndex = if (resolveWithFullInfo) cursor.getColumnIndex(MediaStore.Audio.Media.BITRATE) else -1
  val sizeIndex = if (resolveWithFullInfo) cursor.getColumnIndex(MediaStore.Audio.Media.SIZE) else -1

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
      putDouble("creationTime", cursor.getLong(creationDateIndex) * 1000.0)
      putDouble("modificationTime", cursor.getLong(modificationDateIndex) * 1000.0)
      putDouble("duration", cursor.getLong(durationIndex) / 1000.0)
    }

    if (resolveWithFullInfo) {
      if (titleIndex != -1) asset.putString("title", cursor.getString(titleIndex))
      if (albumIndex != -1) asset.putString("album", cursor.getString(albumIndex))
      if (artistIndex != -1) asset.putString("artist", cursor.getString(artistIndex))
      if (albumArtistIndex != -1) asset.putString("albumArtist", cursor.getString(albumArtistIndex))
      if (yearIndex != -1) asset.putInt("year", cursor.getInt(yearIndex))
      if (discNumberIndex != -1) asset.putInt("discNumber", cursor.getInt(discNumberIndex))
      if (trackNumberIndex != -1) {
        val rawTrackNumber = cursor.getInt(trackNumberIndex)
        // `MediaStore.Audio.Media.TRACK` may contain information about both disc & track number.
        // For example, `1002` would indicate disc 1 & track 2.
        val trackNumber = if (rawTrackNumber >= 1000) rawTrackNumber % 1000 else rawTrackNumber
        asset.putInt("trackNumber", trackNumber)
      }
      if (bitrateIndex != -1) asset.putInt("bitrate", cursor.getInt(bitrateIndex))
      if (sizeIndex != -1) asset.putLong("fileSize", cursor.getLong(sizeIndex))
      asset.putString("genre", getGenreForAudioId(context, assetId))

      // Remove following values if `0`.
      if (asset.getInt("discNumber") == 0) asset.putString("discNumber", null)
      if (asset.getInt("trackNumber") == 0) asset.putString("trackNumber", null)
      if (asset.getInt("year") == 0) asset.putString("year", null)

      // Remove placeholder set for artist.
      if (asset.getString("artist") == ARTIST_PLACEHOLDER) asset.putString("artist", null)

      // Have `albumArtist` fallback to `artist` if it's not defined, but only if `artist` & `album` are defined.
      if (
        asset.getString("albumArtist") == null &&
        asset.getString("artist") != null &&
        asset.getString("album") !== null
      ) {
        asset.putString("albumArtist", asset.getString("artist"))
      }
    }

    cursor.moveToNext()
    response.add(asset)
    i++
  }
}

internal fun getGenreForAudioId(context: Context, audioId: Long): String? {
  if (audioId > Int.MAX_VALUE) return null
  val genreUri = MediaStore.Audio.Genres.getContentUriForAudioId("external", audioId.toInt())
  val projection = arrayOf(MediaStore.Audio.Genres.NAME)
  context.contentResolver.query(genreUri, projection, null, null, null)?.use { cursor ->
    if (cursor.moveToFirst()) {
      val nameIndex = cursor.getColumnIndex(MediaStore.Audio.Genres.NAME)
      if (nameIndex != -1) {
        return cursor.getString(nameIndex)
      }
    }
  }
  return null
}

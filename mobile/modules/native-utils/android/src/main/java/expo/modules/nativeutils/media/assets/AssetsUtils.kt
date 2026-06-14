package expo.modules.nativeutils.media.assets

import android.database.Cursor
import android.os.Bundle
import android.provider.MediaStore

fun putAssetsInfo(
  cursor: Cursor,
  response: MutableList<Bundle>,
  limit: Int,
  offset: Int
) {
  val idIndex = cursor.getColumnIndex(MediaStore.Audio.Media._ID)
  val filenameIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DISPLAY_NAME)
  val localUriIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DATA)
  val mimeTypeIndex = cursor.getColumnIndex(MediaStore.Audio.Media.MIME_TYPE)
  val modificationDateIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DATE_MODIFIED)
  val durationIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DURATION)
  val sizeIndex = cursor.getColumnIndex(MediaStore.Audio.Media.SIZE)

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

    cursor.moveToNext()
    response.add(asset)
    i++
  }
}

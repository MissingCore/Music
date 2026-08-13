package expo.modules.nativeutils.media.assets

import android.content.Context
import android.os.Bundle
import expo.modules.nativeutils.media.ASSET_PROJECTION
import expo.modules.nativeutils.media.AUDIO_METADATA_ASSET_PROJECTION
import expo.modules.nativeutils.media.AssetsOptions
import expo.modules.nativeutils.media.PermissionsException
import expo.modules.nativeutils.media.UnableToLoadException
import java.io.IOException

fun getAssets(context: Context, assetOptions: AssetsOptions): Bundle {
  val contentResolver = context.contentResolver
  try {
    val query = getQueryFromOptions(assetOptions)
    val returnWithMetadata = assetOptions.returnWithMetadata == true && isMetadataSupported()
    val projection = if (returnWithMetadata) AUDIO_METADATA_ASSET_PROJECTION else ASSET_PROJECTION
    val pagedAssets = ArrayList<Bundle>()

    val pageSize = query.limit.toInt().coerceAtLeast(0)
    val startIndex = query.offset.coerceAtLeast(0)

    var globalPosition = 0
    var hasNextPage = false

    for (queryUri in getExternalAudioUris(context)) {
      // Stop if we've already filled the requested page
      if (pageSize > 0 && pagedAssets.size >= pageSize) {
        hasNextPage = true
        break
      }

      contentResolver.query(
        queryUri,
        projection,
        query.selection,
        query.selectionArgs,
        query.order,
      )?.use { assetsCursor ->
        val volumeSize = assetsCursor.count

        // Calculate offset within this specific volume
        val offsetInThisVolume = if (globalPosition < startIndex) {
          minOf(startIndex - globalPosition, volumeSize)
        } else {
          0
        }

        // Calculate how many items we still need to collect for this page
        val remainingToCollect = if (pageSize > 0) {
          pageSize - pagedAssets.size
        } else {
          Int.MAX_VALUE
        }

        // Only query if we still need items
        if (remainingToCollect > 0) {
          val volumeAssets = ArrayList<Bundle>()
          putAssetsInfo(
            assetsCursor,
            volumeAssets,
            remainingToCollect,
            offsetInThisVolume,
            returnWithMetadata,
            queryUri,
          )
          pagedAssets.addAll(volumeAssets)
        }

        globalPosition += volumeSize
      }
    }

    return Bundle().apply {
      putParcelableArrayList("assets", pagedAssets)
      putBoolean("hasNextPage", hasNextPage)
      putInt("endCursor", startIndex + pagedAssets.size)
      putInt("totalCount", globalPosition)
    }
  } catch (e: Exception) {
    throw when (e) {
      is SecurityException -> UnableToLoadException("Could not get asset: need read_external_storage permission", e)
      is IOException -> UnableToLoadException("Could not read file: ${e.message}", e)
      is IllegalArgumentException -> UnableToLoadException(e.message ?: "Invalid MediaType ${e.message}", e)
      is UnsupportedOperationException -> PermissionsException(e.message ?: "Permission denied: ${e.message}")
      else -> e
    }
  }
}

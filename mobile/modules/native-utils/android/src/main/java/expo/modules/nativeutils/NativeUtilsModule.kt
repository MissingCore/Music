package expo.modules.nativeutils

import android.annotation.SuppressLint
import android.content.ContentUris
import android.content.Context
import android.content.res.Configuration
import android.net.Uri
import android.provider.MediaStore
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.io.InputStream
import java.io.IOException
import java.io.OutputStream
import java.net.URL
import java.util.regex.Pattern
import org.apache.commons.io.IOUtils

fun slashifyFilePath(path: String?): String? {
  return if (path == null) {
    null
  } else if (path.startsWith("file:///")) {
    path
  } else {
    // Ensure leading schema with a triple slash
    Pattern.compile("^file:/*").matcher(path).replaceAll("file:///")
  }
}

class NativeUtilsModule : Module() {
  private val context: Context?
    get() = appContext.reactContext

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('NativeUtils')` in JavaScript.
    Name("NativeUtils")

    // Based on:
    //  - https://github.com/zoontek/react-native-bootsplash/blob/7.1.0/android/src/main/java/com/zoontek/rnbootsplash/RNBootSplashModuleImpl.kt#L226
    Constant("isSystemDarkMode") {
      val currentContext = context
      if (currentContext == null) return@Constant false
      val uiMode =
        currentContext.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
      return@Constant uiMode == Configuration.UI_MODE_NIGHT_YES
    }

    // Based on:
    //  - https://github.com/sAleksovski/react-native-android-widget/blob/v0.20.1/android/src/main/java/com/reactnativeandroidwidget/RNWidgetProvider.java#L123-L130
    Function("launchAppViaIntent") {
      val currentContext = context
      if (currentContext !== null) {
        try {
          val launchIntent = currentContext.getPackageManager().getLaunchIntentForPackage(currentContext.getPackageName())
          currentContext.startActivity(launchIntent)
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }
    }

    // Based on:
    //  - https://github.com/expo/expo/blob/sdk-55/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/legacy/FileSystemLegacyModule.kt#L294-L353
    AsyncFunction("saveBundledAssetToURI") { assetName: String, toUri: String ->
      val fromUri = Uri.parse(assetName)
      val toUri = Uri.parse(toUri)

      if (fromUri.scheme == null) {
        // this is probably an asset embedded by the packager in resources
        val inputStream = openResourceInputStream(assetName)
        val out: OutputStream = FileOutputStream(toUri.toFile())
        IOUtils.copy(inputStream, out)
      }
    }


    AsyncFunction("getMusicAssets") { page: Int, pageSize: Int ->
      val currentContext = context
      if (currentContext == null) return@AsyncFunction emptyList<Map<String, Any?>>()

      val normalizedPage = page.coerceAtLeast(0)
      val normalizedPageSize = pageSize.coerceAtLeast(1)
      val offsetLong = normalizedPage.toLong() * normalizedPageSize
      if (offsetLong > Int.MAX_VALUE) return@AsyncFunction emptyList<Map<String, Any?>>()
      val offset = offsetLong.toInt()
      val sortOrder = "${MediaStore.Audio.Media.DATE_ADDED} DESC"

      val projection = arrayOf(
        MediaStore.Audio.Media._ID,
        MediaStore.Audio.Media.DISPLAY_NAME,
        MediaStore.Audio.Media.TITLE,
        MediaStore.Audio.Media.ALBUM,
        MediaStore.Audio.Media.ARTIST,
        MediaStore.Audio.Media.ALBUM_ARTIST,
        MediaStore.Audio.Media.DURATION,
        MediaStore.Audio.Media.SIZE,
        MediaStore.Audio.Media.DATE_ADDED,
        MediaStore.Audio.Media.DATE_MODIFIED,
        MediaStore.Audio.Media.MIME_TYPE,
        MediaStore.Audio.Media.BITRATE,
        MediaStore.Audio.Media.DISC_NUMBER,
        MediaStore.Audio.Media.TRACK,
        MediaStore.Audio.Media.YEAR,
        MediaStore.Audio.Media.DATA
      )

      val selection = "${MediaStore.Audio.Media.MIME_TYPE} LIKE 'audio/%'"
      val queryUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

      val results = mutableListOf<Map<String, Any?>>()
      currentContext.contentResolver.query(queryUri, projection, selection, null, sortOrder)?.use { cursor ->
        if (!cursor.moveToPosition(offset)) return@use

        val idIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
        val displayNameIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME)
        val titleIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
        val albumIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
        val artistIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
        val albumArtistIndex = cursor.getColumnIndex(MediaStore.Audio.Media.ALBUM_ARTIST)
        val durationIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
        val sizeIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE)
        val dateAddedIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_ADDED)
        val dateModifiedIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_MODIFIED)
        val mimeTypeIndex = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE)
        val bitrateIndex = cursor.getColumnIndex(MediaStore.Audio.Media.BITRATE)
        val discNumberIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DISC_NUMBER)
        val trackIndex = cursor.getColumnIndex(MediaStore.Audio.Media.TRACK)
        val yearIndex = cursor.getColumnIndex(MediaStore.Audio.Media.YEAR)
        val dataIndex = cursor.getColumnIndex(MediaStore.Audio.Media.DATA)

        var remaining = normalizedPageSize
        do {
          val id = cursor.getLong(idIndex)
          val contentUri = ContentUris.withAppendedId(queryUri, id)
          val filePath = if (dataIndex != -1) cursor.getString(dataIndex) else null
          val rawUri = if (!filePath.isNullOrBlank()) {
            Uri.fromFile(File(filePath)).toString()
          } else {
            contentUri.toString()
          }
          val uri = Uri.decode(rawUri)
          val durationMs = cursor.getLong(durationIndex)
          val dateAdded = cursor.getLong(dateAddedIndex)
          val dateModified = cursor.getLong(dateModifiedIndex)
          val albumArtist = if (albumArtistIndex != -1) cursor.getString(albumArtistIndex) else null
          val bitrate = if (bitrateIndex != -1) cursor.getInt(bitrateIndex) else null
          val discNumber = if (discNumberIndex != -1) cursor.getInt(discNumberIndex) else null
          val trackNumber = if (trackIndex != -1) cursor.getInt(trackIndex) else null
          val year = if (yearIndex != -1) cursor.getInt(yearIndex) else null
          val genre = getGenreForAudioId(currentContext, id)

          results.add(
            mapOf(
              "id" to id.toString(),
              "uri" to uri,
              "filename" to cursor.getString(displayNameIndex),
              "title" to cursor.getString(titleIndex),
              "album" to cursor.getString(albumIndex),
              "artist" to cursor.getString(artistIndex),
              "albumArtist" to albumArtist,
              "genre" to genre,
              "duration" to if (durationMs >= 0) durationMs.toDouble() / 1000.0 else null,
              "fileSize" to cursor.getLong(sizeIndex),
              "mimeType" to cursor.getString(mimeTypeIndex),
              "bitrate" to bitrate,
              "discNumber" to discNumber,
              "trackNumber" to trackNumber,
              "year" to year,
              "mediaType" to "audio",
              "creationTime" to if (dateAdded > 0) dateAdded * 1000 else null,
              "modificationTime" to if (dateModified > 0) dateModified * 1000 else null
            )
          )

          remaining -= 1
        } while (remaining > 0 && cursor.moveToNext())
      }

      return@AsyncFunction results
    }
  }

  //#region `saveBundledAssetToURI` Utils
  // extension functions of Uri class
  private fun Uri.toFile() = if (this.path != null) {
    File(this.path!!)
  } else {
    throw IOException("Invalid Uri: $this")
  }

  @SuppressLint("DiscouragedApi")
  @Throws(IOException::class)
  private fun openResourceInputStream(resourceName: String?): InputStream {
    val currentContext = context
    if (currentContext == null) throw Exception("React Context is currently undefined.")
    var resourceId = currentContext.resources.getIdentifier(resourceName, "raw", currentContext.packageName)
    if (resourceId == 0) {
      // this resource doesn't exist in the raw folder, so try drawable
      resourceId = currentContext.resources.getIdentifier(resourceName, "drawable", currentContext.packageName)
      if (resourceId == 0) {
        throw FileNotFoundException("No resource found with the name '$resourceName'")
      }
    }
    return currentContext.resources.openRawResource(resourceId)
  }

  private fun getGenreForAudioId(currentContext: Context, audioId: Long): String? {
    if (audioId > Int.MAX_VALUE) return null
    val genreUri = MediaStore.Audio.Genres.getContentUriForAudioId("external", audioId.toInt())
    val projection = arrayOf(MediaStore.Audio.Genres.NAME)
    currentContext.contentResolver.query(genreUri, projection, null, null, null)?.use { cursor ->
      if (cursor.moveToFirst()) {
        val nameIndex = cursor.getColumnIndex(MediaStore.Audio.Genres.NAME)
        if (nameIndex != -1) {
          return cursor.getString(nameIndex)
        }
      }
    }
    return null
  }

  //#endregion
}

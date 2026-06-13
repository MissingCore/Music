package expo.modules.nativeutils

import android.annotation.SuppressLint
import android.content.ContentUris
import android.content.Context
import android.content.res.Configuration
import android.net.Uri
import android.provider.MediaStore
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.nativeutils.media.EXTERNAL_CONTENT_URI
import expo.modules.nativeutils.media.AUDIO_ASSET_PROJECTION
import expo.modules.nativeutils.media.AssetsOptions
import expo.modules.nativeutils.media.assets.getAssets
import java.io.File
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.io.InputStream
import java.io.IOException
import java.io.OutputStream
import org.apache.commons.io.IOUtils

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


    AsyncFunction("getMusicAssets") { assetOptions: AssetsOptions ->
      val currentContext = context
      return@AsyncFunction if (currentContext != null) getAssets(currentContext, assetOptions) else emptyList<Map<String, Any?>>()
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

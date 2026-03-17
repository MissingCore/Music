package expo.modules.nativeutils

import android.content.Context
import android.content.res.Configuration
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

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
  }
}

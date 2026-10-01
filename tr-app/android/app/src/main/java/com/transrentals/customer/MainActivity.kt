package com.transrentals.customer

import android.content.Context
import android.content.res.Configuration
import android.os.Build
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "trAppBackend"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  // With Android's "Bold text" setting on, text views draw heavier than the
  // new architecture measures them, so the last word of a line spills onto a
  // line that isn't there and gets cut off ("Hello Goa" shows as "Hello").
  // Drawing at the normal weight keeps drawing and measuring in step.
  override fun attachBaseContext(newBase: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
        newBase.resources.configuration.fontWeightAdjustment != 0) {
      val config = Configuration(newBase.resources.configuration)
      config.fontWeightAdjustment = 0
      super.attachBaseContext(newBase.createConfigurationContext(config))
    } else {
      super.attachBaseContext(newBase)
    }
  }
}

package com.transrentals.customer

import android.content.ContentValues
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import java.io.File
import java.io.FileOutputStream

class FileUtilModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "FileUtil"

    @ReactMethod
    fun saveBase64ToCache(base64Data: String, filename: String, promise: Promise) {
        try {
            val cacheDir = File(reactApplicationContext.cacheDir, Environment.DIRECTORY_DOWNLOADS)
            if (!cacheDir.exists()) cacheDir.mkdirs()

            val file = File(cacheDir, filename)
            val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
            FileOutputStream(file).use { fos ->
                fos.write(decodedBytes)
                fos.flush()
            }
            promise.resolve(file.absolutePath)
        } catch (e: Exception) {
            promise.reject("FILE_ERROR", "Failed to save file: ${e.message}", e)
        }
    }

    @ReactMethod
    fun saveBase64ToDownloads(base64Data: String, filename: String, mimeType: String, promise: Promise) {
        try {
            val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ - use MediaStore (no permissions needed)
                val contentValues = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, filename)
                    put(MediaStore.Downloads.MIME_TYPE, mimeType)
                    put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }
                val resolver = reactApplicationContext.contentResolver
                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                if (uri != null) {
                    resolver.openOutputStream(uri)?.use { os ->
                        os.write(decodedBytes)
                        os.flush()
                    }
                    promise.resolve(uri.toString())
                } else {
                    promise.reject("FILE_ERROR", "Failed to create file in Downloads")
                }
            } else {
                // Android 9 and below - write directly to Downloads folder
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                if (!downloadsDir.exists()) downloadsDir.mkdirs()
                val file = File(downloadsDir, filename)
                FileOutputStream(file).use { fos ->
                    fos.write(decodedBytes)
                    fos.flush()
                }
                promise.resolve(file.absolutePath)
            }
        } catch (e: Exception) {
            promise.reject("FILE_ERROR", "Failed to save file: ${e.message}", e)
        }
    }
}

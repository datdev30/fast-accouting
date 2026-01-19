package com.fastaccounting.app

import android.content.ContentValues
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.IOException

@CapacitorPlugin(name = "Downloads")
class DownloadsPlugin : Plugin() {

    @PluginMethod
    fun saveToDownloads(call: PluginCall) {
        val fileName = call.getString("fileName") ?: run {
            call.reject("fileName is required")
            return
        }
        val base64Data = call.getString("data") ?: run {
            call.reject("data is required")
            return
        }
        val mimeType = call.getString("mimeType") ?: "application/octet-stream"

        try {
            // Decode base64 data
            val dataBytes = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                java.util.Base64.getDecoder().decode(base64Data)
            } else {
                android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
            }

            val uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ (API 29+): Use MediaStore
                saveViaMediaStore(fileName, mimeType, dataBytes)
            } else {
                // Android 9-: Use legacy method
                saveViaLegacy(fileName, dataBytes)
            }

            val result = JSObject()
            result.put("uri", uri.toString())
            result.put("path", uri.path ?: "")
            result.put("success", true)
            call.resolve(result)
        } catch (e: Exception) {
            call.reject("Failed to save file to Downloads: ${e.message}", e)
        }
    }

    @Suppress("DEPRECATION")
    private fun saveViaLegacy(fileName: String, data: ByteArray): android.net.Uri {
        val downloadsDir = Environment.getExternalStoragePublicDirectory(
            Environment.DIRECTORY_DOWNLOADS
        )
        if (!downloadsDir.exists()) {
            downloadsDir.mkdirs()
        }
        val file = java.io.File(downloadsDir, fileName)
        file.writeBytes(data)
        return android.net.Uri.fromFile(file)
    }

    private fun saveViaMediaStore(
        fileName: String,
        mimeType: String,
        data: ByteArray
    ): android.net.Uri {
        val resolver = context.contentResolver
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Downloads.IS_PENDING, 1)
            }
        }

        val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
        } else {
            MediaStore.Files.getContentUri("external")
        }

        val itemUri = resolver.insert(collection, contentValues)
            ?: throw IOException("Failed to create MediaStore record")

        resolver.openOutputStream(itemUri)?.use { out ->
            out.write(data)
            out.flush()
        } ?: throw IOException("Failed to open output stream")

        // Clear IS_PENDING flag after writing
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            contentValues.clear()
            contentValues.put(MediaStore.Downloads.IS_PENDING, 0)
            resolver.update(itemUri, contentValues, null, null)
        }

        return itemUri
    }
}

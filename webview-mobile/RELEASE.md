# Android release 1.2.1 (versionCode 2)

- WebView URL: https://fast-accounting-client.vercel.app
- Launcher artwork is unchanged. Adaptive icons inset the foreground by 12dp on
  each side (108dp layer: approximately 22% smaller); Android 7 icons use 6dp insets.
- Both round and standard launcher resources use the padded artwork.
- Release signing loads `android/keystore.properties`, which is ignored by Git.
  Required keys: storeFile (absolute path), storePassword, keyAlias, keyPassword.
- The local signing key and backup properties live in
  `%USERPROFILE%/.android/FastAccounting-release/`. Keep a secure backup of this
  folder; future APK updates must use the same key. Never commit these files.

## Build

With JDK 21+ and Android SDK installed, run `npm run apk:release` from
`webview-mobile/`. The signed APK is generated at
`android/app/build/outputs/apk/release/app-release.apk`.

Release and debug builds have different signatures. A debug installation cannot
be upgraded in place using this release APK; uninstall the debug build first.
Uninstalling removes local app data. Server-side data is unaffected.

The icon preview was checked with simulated circle and rounded-square adaptive
masks. Physical Android launcher and installation testing remain to be done.

# Android Background Geolocation Setup Fix

## Issues

### Issue 1: TransistorSoft Dependency Not Found
```
Could not find any matches for com.transistorsoft:tslocationmanager-v21:3.+
```

### Issue 2: CMake/JSI Cache Corruption
```
CMake Error: Imported target "ReactAndroid::jsi" includes non-existent path
```

## Solution

Both issues have been addressed:
1. The `react-native-background-geolocation` library includes its dependencies as local AAR files - build.gradle has been updated
2. Gradle cache has been cleared to fix the CMake corruption issue

### ✅ Changes Already Applied

1. **Updated `android/build.gradle`** - Added repository configuration

### 🔧 Additional Steps Required

#### Step 1: Clean Build Cache

```bash
cd android
./gradlew clean
cd ..
```

#### Step 2: Clear Node Modules and Reinstall

```bash
# Clear watchman (if using)
watchman watch-del-all

# Clear metro cache
npx react-native start --reset-cache

# In a new terminal, rebuild
cd android
./gradlew clean
cd ..
npx react-native run-android
```

#### Step 3: If Still Failing - Manual Dependency Check

Check if the library was installed correctly:

```bash
ls -la node_modules/react-native-background-geolocation/android/libs/
```

You should see:
- `tslocationmanager.aar`
- `common.aar`

If these files are missing, reinstall the package:

```bash
npm uninstall react-native-background-geolocation
npm install react-native-background-geolocation --save
cd android && ./gradlew clean && cd ..
```

## Alternative: Use Specific Version

If the issue persists, you can specify an exact version in `package.json`:

```json
{
  "dependencies": {
    "react-native-background-geolocation": "^4.16.2"
  }
}
```

Then:
```bash
rm -rf node_modules package-lock.json
npm install
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

## Gradle Configuration Details

### What Was Added to `android/build.gradle`:

```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
        
        // Required for react-native-background-geolocation
        maven {
            url("${project(':react-native-background-geolocation').projectDir}/libs")
        }
        maven {
            url 'https://developer.huawei.com/repo/'
        }
    }
}
```

This tells Gradle to:
1. Look in the local `libs` folder of the background-geolocation package
2. Access Huawei repository (optional, for HMS support)

## Verification

After rebuilding, you should see in the build logs:

```
> Task :react-native-background-geolocation:compileDebugJavaWithJavac
```

Without errors.

## Common Issues & Solutions

### Issue 1: "Could not find :react-native-background-geolocation"
**Solution:** The package isn't linked properly
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Issue 2: "Duplicate class found"
**Solution:** Clear build cache
```bash
cd android
./gradlew clean cleanBuildCache
rm -rf .gradle
cd ..
```

### Issue 3: Build still fails
**Solution:** Check your React Native version compatibility

The library requires:
- React Native >= 0.60 (uses autolinking)
- Android SDK >= 21
- Google Play Services Location >= 21.0.0

Your current setup:
- ✅ minSdkVersion: 24
- ✅ Google Play Services: 21.0.1
- ✅ React Native: 0.80

## Testing the Fix

After successful build:

1. **App should launch without errors**
2. **Check logs for background geolocation:**
   ```bash
   npx react-native log-android | grep -i "TSLocationManager\|BackgroundGeo"
   ```

3. **Test in app:**
   - Navigate to trip tracking screen
   - Grant location permission
   - Check console for: `✅ BackgroundGeo: Configured successfully`

## Build Commands Summary

```bash
# Full clean rebuild
cd android
./gradlew clean
cd ..
rm -rf node_modules package-lock.json
npm install
cd ios && pod install && cd ..
npx react-native run-android
```

## If All Else Fails

Try the nuclear option:

```bash
# Delete all build artifacts
cd android
rm -rf .gradle
rm -rf build
rm -rf app/build
./gradlew clean
cd ..

# Delete node modules
rm -rf node_modules
rm -rf package-lock.json

# Fresh install
npm install

# Rebuild
npx react-native run-android
```

## Expected Build Output

Successful build should show:

```
> Task :react-native-background-geolocation:compileDebugJavaWithJavac
> Task :react-native-background-geolocation:bundleDebugAar
> Task :app:compileDebugJavaWithJavac
> Task :app:installDebug
BUILD SUCCESSFUL in 2m 15s
```

## Troubleshooting Checklist

- [ ] Cleaned Android build (`./gradlew clean`)
- [ ] Cleared Metro cache (`--reset-cache`)
- [ ] Reinstalled node_modules
- [ ] Checked `node_modules/react-native-background-geolocation/android/libs/` exists
- [ ] Verified React Native version compatibility
- [ ] Restarted Android Studio / IDE
- [ ] Checked Android SDK is properly installed

## Support

If you're still having issues:

1. **Check the library's issue tracker:**
   https://github.com/transistorsoft/react-native-background-geolocation/issues

2. **Verify your setup against the official docs:**
   https://github.com/transistorsoft/react-native-background-geolocation/blob/master/docs/INSTALL-ANDROID.md

3. **Check Gradle version:**
   ```bash
   cd android && ./gradlew --version
   ```

4. **Enable Gradle debug output:**
   ```bash
   cd android
   ./gradlew app:assembleDebug --stacktrace --info
   ```

---

**Status:** Configuration updated, ready for clean rebuild

**Next Step:** Run the clean build commands above


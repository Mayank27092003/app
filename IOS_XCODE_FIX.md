# iOS Xcode Linker Error Fix

## Error
```
Undefined symbol: _OBJC_CLASS_$_TSBackgroundFetch
Linker command failed with exit code 1
```

## ✅ Pods Already Reinstalled

The pods have been successfully reinstalled with `pod deintegrate && pod install`.

## 🔧 Fix Steps in Xcode

### Step 1: Clean Build Folder
1. Open **Xcode**
2. Go to **Product** → **Clean Build Folder** (or press `Cmd+Shift+K`)
3. Wait for cleaning to complete

### Step 2: Delete Derived Data
1. In Xcode, go to **Window** → **Devices and Simulators** → **Close**
2. Go to **Xcode** → **Settings** → **Locations**
3. Click the arrow next to **Derived Data** path
4. Delete the **CoinBase** folder
5. Close Xcode

### Step 3: Rebuild
1. **Reopen Xcode** (important - fresh start)
2. Select your target device/simulator
3. Go to **Product** → **Build** (or press `Cmd+B`)
4. Wait for build to complete

## 🚀 Alternative: Command Line Build

If Xcode GUI doesn't work, use terminal:

```bash
cd /Users/rajangupta/Documents/Personal/logistic

# Clean everything
cd ios
rm -rf build
rm -rf ~/Library/Developer/Xcode/DerivedData/CoinBase-*
cd ..

# Rebuild
npx react-native run-ios
```

## 🔍 Verify Pod Installation

Check if the pod was installed correctly:

```bash
cd ios
pod list | grep -i background
# Should show: react-native-background-geolocation
```

## ⚠️ If Still Failing

### Check 1: Verify Pod is in Podfile.lock
```bash
cd ios
cat Podfile.lock | grep -A 5 "react-native-background-geolocation"
```

Should show something like:
```
- react-native-background-geolocation (4.x.x):
  - CocoaLumberjack (~> 3.7.2)
  - React-Core
```

### Check 2: Check Framework Search Paths
In Xcode:
1. Select **CoinBase** project
2. Select **CoinBase** target
3. Go to **Build Settings**
4. Search for **Framework Search Paths**
5. Should include: `$(inherited)` and `${PODS_CONFIGURATION_BUILD_DIR}`

### Check 3: Verify Library Search Paths
In same **Build Settings**:
1. Search for **Library Search Paths**
2. Should include: `$(inherited)` and `${PODS_CONFIGURATION_BUILD_DIR}`

### Check 4: Check Other Linker Flags
In same **Build Settings**:
1. Search for **Other Linker Flags**
2. Should include: `-ObjC` and `$(inherited)`

## 🛠️ Nuclear Option (If Nothing Works)

Complete clean and rebuild:

```bash
cd /Users/rajangupta/Documents/Personal/logistic

# Stop any running processes
killall -9 node
killall -9 Metro

# Remove everything
rm -rf ios/Pods
rm -rf ios/Podfile.lock
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/CoinBase-*
rm -rf node_modules
rm -rf package-lock.json

# Reinstall everything
npm install
cd ios
pod install --repo-update
cd ..

# Rebuild
npx react-native run-ios
```

## ✅ Expected Success

After successful build, you should see:
```
** BUILD SUCCEEDED **
```

And when running:
```
✅ BackgroundGeo: Configured successfully
```

## 📱 Test on Device vs Simulator

**Important:** Background geolocation works best on **real devices**, not simulators.

- ✅ **Real Device**: Full functionality
- ⚠️ **Simulator**: Limited functionality (no motion detection, no background modes)

## 🔍 Verify Installation After Build

Once app is running, check console:
```javascript
import BackgroundGeolocation from 'react-native-background-geolocation';

// This should NOT crash
console.log('BackgroundGeolocation:', BackgroundGeolocation);
```

## 📚 Related Files

- **Service**: `app/service/background-geolocation-service.tsx`
- **Store**: `app/store/locationStore.ts`
- **Component**: `app/module/tracking/view/tripTracking.tsx`

## 🆘 Still Having Issues?

1. **Check Xcode version**: Requires Xcode 14+ for iOS 13+
2. **Check iOS deployment target**: Should be 13.0+
3. **Check CocoaPods version**: `pod --version` (should be 1.11+)
4. **Check the build log** in Xcode for more details

---

**Status:** Pods reinstalled ✅ - Ready to rebuild in Xcode

**Next Step:** Clean build folder in Xcode and rebuild


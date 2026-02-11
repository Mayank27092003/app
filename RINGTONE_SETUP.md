# Ringtone Setup Instructions

## 📱 Setting up Call Ringtone

The calling system is now properly configured to play ringtone sounds! Follow these steps to add the ringtone file:

### For Android

1. **Create the raw directory** (if not already created):
   ```bash
   mkdir -p android/app/src/main/res/raw
   ```

2. **Add your ringtone file**:
   - Place your `beep.mp3` file in: `android/app/src/main/res/raw/beep.mp3`
   - You can use any MP3 file as a ringtone
   - The file should be small and suitable for looping

3. **File naming**:
   - The file MUST be named `beep.mp3`
   - It MUST be lowercase
   - It MUST be in the `raw` directory

4. **Rebuild the app**:
   ```bash
   cd android && ./gradlew clean
   cd .. && npm run android
   ```

### For iOS

1. **Open Xcode**:
   ```bash
   open ios/CoinBase.xcworkspace
   ```

2. **Add the sound file**:
   - Right-click on the project in the Project Navigator
   - Select "Add Files to CoinBase..."
   - Select your `beep.mp3` file
   - ✅ Make sure "Copy items if needed" is checked
   - ✅ Make sure "Add to targets: CoinBase" is checked
   - Click "Add"

3. **Rebuild the app**:
   ```bash
   npm run ios
   ```

## 🎵 Finding or Creating a Ringtone

### Option 1: Use a Free Ringtone
- Download from: https://www.zedge.net/ringtones
- Or use any MP3 file you have

### Option 2: Create Your Own
- Use online tools like: https://www.online-convert.com/
- Convert any audio file to MP3
- Keep it short (2-5 seconds) for looping

### Option 3: Use a Simple Beep
- Download a simple beep sound from: https://freesound.org/
- Search for "beep" or "notification"
- Download as MP3

## ✅ How to Test

1. **After adding the ringtone file and rebuilding**:
   - Open the WebRTC Test Screen
   - Click "Test Ringing Directly" button
   - You should hear: 🔊 **Audio + Vibration**

2. **Expected logs**:
   ```
   📞 CallNotification: Attempting to play ringtone...
   📞 CallNotification: ✅ Ringtone playing: [success]
   📞 CallNotification: ✅ Enhanced ringing started (vibration + audio attempt)
   ```

3. **If it fails, check**:
   - File is in the correct directory
   - File is named exactly `beep.mp3` (lowercase)
   - App was rebuilt after adding the file
   - Check the logs for specific error messages

## 🎯 Current Status

- ✅ **Vibration**: Working perfectly (enhanced pattern)
- ⏳ **Audio**: Waiting for `beep.mp3` file to be added
- ✅ **Looping**: Audio will loop continuously during incoming call
- ✅ **Stop**: Audio stops when call is answered/declined

## 📝 Notes

- The code is ready and will automatically work once the file is added
- No code changes needed - just add the file and rebuild
- Both Android and iOS are supported with proper paths
- The system gracefully falls back to vibration-only if audio fails


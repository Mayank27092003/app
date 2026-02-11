# NitroSound Setup for Call Notifications

## 🎵 **Why NitroSound?**

NitroSound is a modern, high-performance audio library for React Native that provides:

- **Zero Bridge Overhead**: Direct native module access for maximum performance
- **Full Type Safety**: TypeScript definitions generated from native specifications
- **Synchronous Methods**: Better developer experience with synchronous operations
- **Event Listeners**: Native callbacks with type-safe event payloads
- **Cross-Platform**: Works on iOS, Android, and Web
- **Background Processing**: Audio operations run in background threads

## 📦 **Installation**

### 1. Install the Package

```bash
npm install react-native-nitro-sound
# or
yarn add react-native-nitro-sound
```

### 2. iOS Setup

Add to `ios/Podfile`:
```ruby
pod 'react-native-nitro-sound', :path => '../node_modules/react-native-nitro-sound'
```

Then run:
```bash
cd ios && pod install
```

### 3. Android Setup

Add to `android/settings.gradle`:
```gradle
include ':react-native-nitro-sound'
project(':react-native-nitro-sound').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-nitro-sound/android')
```

Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation project(':react-native-nitro-sound')
}
```

### 4. Expo Setup (if using Expo)

```bash
npx expo install react-native-nitro-sound
```

## 🔧 **Configuration**

### 1. iOS Permissions

Add to `ios/YourApp/Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for call notifications</string>
<key>NSCameraUsageDescription</key>
<string>This app needs camera access for video calls</string>
```

### 2. Android Permissions

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.VIBRATE" />
```

## 🎵 **Usage Examples**

### Basic Ringtone Playback

```typescript
import { NitroSound } from 'react-native-nitro-sound';

const sound = new NitroSound();

// Load and play a ringtone
await sound.load('ringtone.mp3');
sound.play({
  loop: true,
  volume: 1.0,
  rate: 1.0
});
```

### Custom Ringtone Loading

```typescript
// Load custom ringtone
const success = await callNotificationService.loadCustomRingtone('custom_ringtone.mp3');
if (success) {
  console.log('Custom ringtone loaded successfully');
}
```

### Volume Control

```typescript
// Set ringtone volume (0.0 to 1.0)
callNotificationService.setRingtoneVolume(0.8);
```

## 🎯 **Features**

### 1. **High-Performance Audio**
- Zero bridge overhead for maximum performance
- Native audio processing on both platforms
- Background audio support

### 2. **Advanced Controls**
- Volume control
- Playback rate control
- Loop control
- Event listeners for audio state changes

### 3. **Cross-Platform**
- iOS: Uses AVAudioPlayer
- Android: Uses MediaPlayer
- Web: Uses Web Audio API

## 🔄 **Migration from react-native-sound**

The call notification service has been updated to use NitroSound instead of react-native-sound. The API is similar but with better performance:

```typescript
// Old (react-native-sound)
sound.setNumberOfLoops(-1);
sound.play();

// New (NitroSound)
sound.play({
  loop: true,
  volume: 1.0,
  rate: 1.0
});
```

## 🐛 **Troubleshooting**

### Common Issues

1. **Audio not playing**: Check permissions and file paths
2. **Performance issues**: Ensure you're using the latest version
3. **TypeScript errors**: Make sure types are properly imported

### Debug Logs

The service includes comprehensive logging:
```typescript
console.log('📞 CallNotification: NitroSound initialized successfully');
console.log('📞 CallNotification: Ringing sound started');
console.log('📞 CallNotification: NitroSound stopped successfully');
```

## 📱 **Testing**

### Test Ringtone Playback

```typescript
// Test the notification service
callNotificationService.showIncomingCallNotification({
  callId: 'test_call',
  callerId: '123',
  type: 'audio'
});

// Stop after 5 seconds
setTimeout(() => {
  callNotificationService.stopRinging();
}, 5000);
```

## 🎵 **Custom Ringtones**

### Supported Formats
- MP3
- WAV
- M4A
- AAC

### Adding Custom Ringtones

1. Place ringtone files in `app/assets/sounds/`
2. Load them using the service:
```typescript
await callNotificationService.loadCustomRingtone('my_ringtone.mp3');
```

## 🚀 **Performance Benefits**

- **Faster Audio Loading**: Direct native access
- **Lower Memory Usage**: Efficient audio processing
- **Better Battery Life**: Optimized for mobile devices
- **Smoother UI**: Background audio processing

---

**Note**: Make sure to test the audio functionality on both iOS and Android devices to ensure proper operation.

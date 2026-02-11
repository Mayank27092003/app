# WebRTC Setup for React Native

This guide explains how to set up WebRTC calling functionality in your React Native app.

## 📦 Dependencies

The following packages are already installed in your project:

- `react-native-webrtc` - WebRTC implementation for React Native
- `react-native-permissions` - Permission handling
- `socket.io-client` - Real-time communication for call signaling

## 🚀 Setup Instructions

### 1. Android Permissions

Add the following permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.INTERNET" />
```

### 2. iOS Permissions

Add the following to `ios/YourApp/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to microphone for audio calls</string>
```

### 3. Navigation Setup

Update your navigation to include the CallScreen:

```typescript
// In your navigator
import { CallScreen } from '@app/module/calls/view/call';

// Add to your stack navigator
<Stack.Screen 
  name="CallScreen" 
  component={CallScreen}
  options={{ headerShown: false }}
/>
```

## 🎯 Usage Examples

### Starting a Call

```typescript
import { useCallStore } from '@app/store/callStore';
import { requestWebRTCPermissions } from '@app/utils/webrtc-permissions';

const { initiateCall } = useCallStore();

const startCall = async (receiverId: string) => {
  // Request permissions
  const permissions = await requestWebRTCPermissions();
  
  if (!permissions.granted) {
    Alert.alert('Permissions Required', 'Camera and microphone permissions are required.');
    return;
  }

  // Start the call
  const callData = await initiateCall(receiverId, 'video');
  
  // Navigate to call screen
  navigation.navigate('CallScreen', {
    receiverId,
    callType: 'video',
    callId: callData.callId,
  });
};
```

### Handling Incoming Calls

```typescript
import { useCallStore } from '@app/store/callStore';

const { 
  isIncomingCall, 
  currentCall, 
  answerCall, 
  rejectCall 
} = useCallStore();

// Answer call
const handleAnswer = async () => {
  if (currentCall) {
    await answerCall(currentCall.callId, currentCall.type);
  }
};

// Reject call
const handleReject = () => {
  if (currentCall) {
    rejectCall(currentCall.callId);
  }
};
```

## 🔧 Key Components

### WebRTC Service (`app/service/webrtc-service.tsx`)
- Handles peer connection setup
- Manages media streams
- Handles WebRTC signaling
- Integrates with socket service for call events

### Call Store (`app/store/callStore.ts`)
- Manages call state
- Provides call actions (initiate, answer, end, reject)
- Handles media controls (mute, video, speaker)

### Call Screen (`app/module/calls/view/call.tsx`)
- UI for active calls
- Video/audio controls
- Call status display
- Integration with WebRTC service

### Permissions (`app/utils/webrtc-permissions.ts`)
- Handles camera and microphone permissions
- Cross-platform permission requests
- Permission status checking

## 📱 Features

### Audio Calls
- High-quality audio transmission
- Mute/unmute functionality
- Speaker/earpiece toggle
- Call duration tracking

### Video Calls
- HD video transmission
- Local and remote video streams
- Video on/off toggle
- Picture-in-picture local video

### Call Management
- Incoming call handling
- Call rejection
- Call ending
- Call history tracking

## 🔌 Socket Events

The WebRTC service uses the following socket events:

### Outgoing Events
- `call_invitation` - Send call invitation
- `call_answer` - Answer a call
- `call_reject` - Reject a call
- `call_end` - End a call
- `webrtc_offer` - Send WebRTC offer
- `webrtc_answer` - Send WebRTC answer
- `webrtc_ice_candidate` - Send ICE candidate

### Incoming Events
- `call_invitation` - Receive call invitation
- `call_answer` - Call was answered
- `call_reject` - Call was rejected
- `call_end` - Call was ended
- `webrtc_offer` - Receive WebRTC offer
- `webrtc_answer` - Receive WebRTC answer
- `webrtc_ice_candidate` - Receive ICE candidate

## 🐛 Troubleshooting

### Common Issues

1. **Permissions Denied**
   - Ensure permissions are properly configured
   - Check device settings
   - Use `requestWebRTCPermissions()` before starting calls

2. **No Video/Audio**
   - Check if media devices are available
   - Verify permissions are granted
   - Test on physical device (not simulator)

3. **Connection Issues**
   - Check network connectivity
   - Verify STUN server configuration
   - Ensure socket connection is active

4. **Build Issues**
   - Clean and rebuild the project
   - Check if all dependencies are properly linked
   - Verify platform-specific configurations

### Debug Tips

- Enable console logging in WebRTC service
- Check socket connection status
- Monitor permission states
- Test on different devices and networks

## 🚀 Next Steps

1. **Customize UI** - Modify the call screen design
2. **Add Features** - Implement call recording, screen sharing
3. **Optimize Performance** - Adjust video quality settings
4. **Add Analytics** - Track call metrics and usage
5. **Implement Push Notifications** - For incoming calls when app is backgrounded

## 📚 Resources

- [React Native WebRTC Documentation](https://github.com/react-native-webrtc/react-native-webrtc)
- [WebRTC API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Socket.IO Documentation](https://socket.io/docs/)
- [React Native Permissions](https://github.com/zoontek/react-native-permissions)

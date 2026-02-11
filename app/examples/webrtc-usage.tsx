/**
 * WebRTC Usage Examples
 * @format
 */

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCallStore } from '@app/store/callStore';
import { requestWebRTCPermissions } from '@app/utils/webrtc-permissions';

/**
 * Example component showing how to initiate a call
 */
export const CallExample = () => {
  const navigation = useNavigation();
  const { initiateCall, isInCall, currentCall } = useCallStore();

  const handleStartCall = async (receiverId: string, callType: 'audio' | 'video' = 'video') => {
    try {
      // Request permissions first
      const permissions = await requestWebRTCPermissions();
      
      if (!permissions.granted) {
        Alert.alert(
          'Permissions Required',
          'Camera and microphone permissions are required for calls.'
        );
        return;
      }

      // Initiate the call
      const callData = await initiateCall(receiverId, callType);
      
      // Navigate to call screen
      navigation.navigate('CallScreen', {
        receiverId,
        callType,
        callId: callData.callId,
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      Alert.alert('Call Failed', 'Unable to start the call. Please try again.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>WebRTC Call Examples</Text>
      
      <TouchableOpacity
        style={{ 
          backgroundColor: '#007AFF', 
          padding: 15, 
          borderRadius: 8, 
          marginBottom: 10 
        }}
        onPress={() => handleStartCall('user123', 'video')}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Start Video Call
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ 
          backgroundColor: '#34C759', 
          padding: 15, 
          borderRadius: 8, 
          marginBottom: 10 
        }}
        onPress={() => handleStartCall('user123', 'audio')}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Start Audio Call
        </Text>
      </TouchableOpacity>

      {isInCall && (
        <Text style={{ color: 'green', marginTop: 10 }}>
          Call Active: {currentCall?.callId}
        </Text>
      )}
    </View>
  );
};

/**
 * Example of handling incoming calls
 */
export const IncomingCallHandler = () => {
  const { 
    isIncomingCall, 
    currentCall, 
    answerCall, 
    rejectCall 
  } = useCallStore();

  const handleAnswerCall = async () => {
    if (!currentCall) return;
    
    try {
      await answerCall(currentCall.callId, currentCall.type);
      // Navigate to call screen
      // navigation.navigate('CallScreen', { ... });
    } catch (error) {
      console.error('Failed to answer call:', error);
    }
  };

  const handleRejectCall = () => {
    if (!currentCall) return;
    rejectCall(currentCall.callId);
  };

  if (!isIncomingCall) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <Text style={{ color: 'white', fontSize: 24, marginBottom: 20 }}>
        Incoming Call
      </Text>
      
      <Text style={{ color: 'white', marginBottom: 30 }}>
        Call from: {currentCall?.callerId}
      </Text>

      <View style={{ flexDirection: 'row', gap: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: 'red',
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleRejectCall}
        >
          <Text style={{ color: 'white', fontSize: 24 }}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: 'green',
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleAnswerCall}
        >
          <Text style={{ color: 'white', fontSize: 24 }}>✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

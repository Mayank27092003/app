import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useCallStore } from '@app/store/callStore';
import { getCameraPermission, getMicrophonePermission, checkWebRTCPermissions, requestWebRTCPermissions } from '@app/utils/webrtc-permissions';
import { Colors } from '@app/styles';
import { selectProfile } from '@app/module/common';
import { useSelector } from 'react-redux';
import { webrtcService } from '@app/service/webrtc-service';

const WebRTCTestScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const profileData = useSelector(selectProfile);
  console.log('WebRTC Test Screen - Profile Data:', profileData);
  const {
    isInCall,
    isIncomingCall,
    isOutgoingCall,
    currentCall,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    initWebRTCEventListeners,
  } = useCallStore();

  const [testReceiverId, setTestReceiverId] = useState(profileData.id === 19 ? 21 : 19);
  const [manualCallId, setManualCallId] = useState('');
  const [offerData, setOfferData] = useState('');
  const [answerData, setAnswerData] = useState('');
console.log('answerData', answerData);
  // Initialize WebRTC event listeners on component mount
  useEffect(() => {
    console.log('📞 WebRTC Test Screen: Initializing event listeners');
    initWebRTCEventListeners();
  }, [initWebRTCEventListeners]);

  // Debug incoming call state changes
  useEffect(() => {
    console.log('📞 WebRTC Test Screen: Call state changed:', {
      isIncomingCall,
      isOutgoingCall,
      isInCall,
      currentCall
    });
  }, [isIncomingCall, isOutgoingCall, isInCall, currentCall]);

  const handleStartVideoCall = async () => {
    if (!profileData?.id) {
      Alert.alert(t("common.error"), t("common.userNotLoggedIn"));
      return;
    }

    try {
      // Request permissions
      const cameraGranted = await getCameraPermission();
      const micGranted = await getMicrophonePermission();

      if (!micGranted || !cameraGranted) {
        Alert.alert(t("common.permissionsRequired") || "Permissions Required", t("common.cameraMicPermissionsVideo") || "Camera and microphone permissions are needed for video calls.");
        return;
      }

      await initiateCall(testReceiverId.toString(), 'video');
      (navigation as any).navigate('CallScreen', { 
        receiverId: testReceiverId.toString(), 
        callType: 'video' 
      });
    } catch (error) {
      console.error('Failed to start video call:', error);
      Alert.alert(t("common.callError"), `${t("common.couldNotStartVideoCall") || "Could not start the video call"}: ${error.message || error}`);
    }
  };

  const handleStartAudioCall = async () => {
    if (!profileData?.id) {
      Alert.alert(t("common.error"), t("common.userNotLoggedIn"));
      return;
    }

    try {
      // Request permissions
      const micGranted = await getMicrophonePermission();

      if (!micGranted) {
        Alert.alert(t("common.permissionsRequired") || "Permissions Required", t("common.microphonePermissionAudio") || "Microphone permission is needed for audio calls.");
        return;
      }

      // Clean up any existing call state before starting new call
      console.log('🧹 Cleaning up existing call state...');
      const { endCall, currentCall } = useCallStore.getState();
      if (currentCall?.callId) {
        await endCall(currentCall.callId);
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Use a test conversation ID (you can change this to a real conversation ID)
      const conversationId = 48; // Replace with actual conversation ID
      const callType = 'audio';
      const isGroupCall = true; // Set to true for group calls
      
      console.log('🎯 Starting audio call via backend API...');
      
      // Initiate call via backend API
      const result = await webrtcService.initiateCall(conversationId, callType, isGroupCall);
      
      console.log('✅ Audio call initiated successfully:', result);
      
      // Show success message with call session ID
      Alert.alert(
        t("common.callInitiated") || "Call Initiated", 
        `${t("common.callStartedSuccess") || "Call started successfully!"}\n\n${t("common.callSessionId") || "Call Session ID"}: ${result.data.id}\n${t("common.conversationId") || "Conversation ID"}: ${conversationId}\n${t("common.callType") || "Call Type"}: ${callType}\n${t("common.groupCall") || "Group Call"}: ${isGroupCall ? t("common.yes") : t("common.no")}`,
        [
          { text: t("common.continueToCall") || "Continue to Call", onPress: () => {
            (navigation as any).navigate('CallScreen', { 
              callId: result.data.id.toString(),
              receiverId: conversationId.toString(), 
              callType: callType,
              isBackendCall: true, // Flag to indicate this is a backend-initiated call
              conversationId: conversationId
            });
          }},
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Failed to start audio call:', error);
      Alert.alert(t("common.callError"), `${t("common.couldNotStartAudioCall") || "Could not start the audio call"}: ${error.message || error}`);
    }
  };

  const handleAnswerIncomingCall = async () => {
    if (currentCall && isIncomingCall) {
      const cameraGranted = currentCall.type === 'video' ? await getCameraPermission() : true;
      const micGranted = await getMicrophonePermission();

      if (!micGranted || (currentCall.type === 'video' && !cameraGranted)) {
        Alert.alert(t("common.permissionsRequired") || "Permissions Required", t("common.cameraMicPermissionsAnswer") || "Camera and microphone permissions are needed to answer this call.");
        return;
      }

      try {
        console.log('📞 WebRTC Test Screen: Starting to answer call...');
        
        // Answer the manual call (this creates the answer and stores it)
        console.log('📞 WebRTC Test Screen: Calling answerManualCall...');
        await webrtcService.answerManualCall(currentCall.callId);
        
        console.log('📞 WebRTC Test Screen: Answer created, navigating to call screen...');
        
        // Navigate to call screen (don't call completeManualCall here)
        (navigation as any).navigate('CallScreen', { 
          callId: currentCall.callId, 
          receiverId: currentCall.callerId, 
          callType: currentCall.type 
        });
        
        // Get the answer data that was just created
        const answerData = await webrtcService.getStoredAnswer(currentCall.callId);
        const answerJson = answerData ? JSON.stringify(answerData.answer, null, 2) : 'No answer data available';
        
        // Update the answer data field
        setAnswerData(answerJson);
        
        Alert.alert(
          'Call Answered', 
          'Call answered successfully! Copy the answer data below and share it with the caller.',
          [
            { text: 'Copy Answer Data', onPress: () => {
              // Copy to clipboard if available
              Alert.alert('Answer Data Copied', 'Answer data has been copied to the text area. Share this with Device A.');
            }},
            { text: 'OK' }
          ]
        );
      } catch (error) {
        console.error('❌ WebRTC Test Screen: Failed to answer call:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        Alert.alert('Call Error', `Could not answer the call: ${error.message || error}`);
      }
    }
  };

  const handleRejectIncomingCall = () => {
    if (currentCall && isIncomingCall) {
      rejectCall(currentCall.callId);
    }
  };

  const handleEndCurrentCall = () => {
    if (isInCall) {
      endCall();
    }
  };

  const checkMicrophoneStatus = () => {
    const audioInfo = webrtcService.getAudioTrackInfo();
    const isActive = webrtcService.isMicrophoneActive();
    const localStream = webrtcService.getLocalStream();
    const remoteStream = webrtcService.getRemoteStream();
    
    console.log('🎤 Microphone Status:', {
      isActive,
      audioInfo,
      hasLocalStream: !!localStream,
      streamActive: localStream?.active,
      hasRemoteStream: !!remoteStream,
      remoteStreamActive: remoteStream?.active
    });
    
    Alert.alert(
      'Microphone Status',
      `Local Audio:\n` +
      `Active: ${isActive}\n` +
      `Enabled: ${audioInfo?.enabled}\n` +
      `Ready State: ${audioInfo?.readyState}\n` +
      `Muted: ${audioInfo?.muted}\n` +
      `Has Stream: ${!!localStream}\n` +
      `Stream Active: ${localStream?.active}\n\n` +
      `Remote Audio:\n` +
      `Has Remote Stream: ${!!remoteStream}\n` +
      `Remote Active: ${remoteStream?.active}`
    );
  };

  const checkWebRTCConnection = () => {
    const connectionState = webrtcService.getConnectionState();
    const iceConnectionState = webrtcService.getIceConnectionState();
    const signalingState = webrtcService.getSignalingState();
    
    console.log('📞 WebRTC Connection Status:', {
      connectionState,
      iceConnectionState,
      signalingState
    });
    
    Alert.alert(
      'WebRTC Connection Status',
      `Connection State: ${connectionState}\n` +
      `ICE Connection: ${iceConnectionState}\n` +
      `Signaling State: ${signalingState}`
    );
  };

  const checkPermissions = async () => {
    try {
      console.log('🔐 Checking WebRTC permissions...');
      const permissions = await checkWebRTCPermissions();
      
      console.log('🔐 Permission Status:', permissions);
      
      Alert.alert(
        'Permission Status',
        `Camera: ${permissions.permissions.camera ? '✅ Granted' : '❌ Denied'}\n` +
        `Microphone: ${permissions.permissions.microphone ? '✅ Granted' : '❌ Denied'}\n` +
        `Overall: ${permissions.granted ? '✅ All Granted' : '❌ Some Denied'}`
      );
      
      return permissions;
    } catch (error) {
      console.error('❌ Permission check failed:', error);
      Alert.alert('Permission Error', `Failed to check permissions: ${error.message}`);
      return null;
    }
  };

  const requestPermissions = async () => {
    try {
      console.log('🔐 Requesting WebRTC permissions...');
      const permissions = await requestWebRTCPermissions();
      
      console.log('🔐 Permission Request Result:', permissions);
      
      Alert.alert(
        'Permission Request',
        `Camera: ${permissions.permissions.camera ? '✅ Granted' : '❌ Denied'}\n` +
        `Microphone: ${permissions.permissions.microphone ? '✅ Granted' : '❌ Denied'}\n` +
        `Overall: ${permissions.granted ? '✅ All Granted' : '❌ Some Denied'}`
      );
      
      return permissions;
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      Alert.alert('Permission Error', `Failed to request permissions: ${error.message}`);
      return null;
    }
  };

  const forceEnableMicrophone = () => {
    const success = webrtcService.forceEnableMicrophone();
    Alert.alert(
      'Force Enable Microphone',
      success ? 'Microphone enabled successfully!' : 'Failed to enable microphone'
    );
  };

  const simulateIncomingCall = () => {
    console.log('📞 WebRTC Test Screen: Simulating incoming call');
    const mockCallData = {
      callId: `test_call_${Date.now()}`,
      callerId: '19',
      receiverId: profileData?.id?.toString() || '21',
      type: 'audio' as const,
      status: 'ringing' as const,
      timestamp: Date.now(),
    };
    
    // Manually trigger incoming call
    const { handleIncomingCall } = useCallStore.getState();
    handleIncomingCall(mockCallData);
    
    Alert.alert('Simulated Incoming Call', 'Test incoming call created!');
  };

  const joinCallWithId = async () => {
    if (!manualCallId.trim()) {
      Alert.alert('Error', 'Please enter a call ID');
      return;
    }

    console.log('📞 WebRTC Test Screen: Joining call with ID:', manualCallId);
    
    try {
      // Set up the call in WebRTC service first
      const mockCallData = {
        callId: manualCallId.trim(),
        callerId: '19', // Assume calling from user 19
        receiverId: profileData?.id?.toString() || '21',
        type: 'audio' as const,
        status: 'ringing' as const,
        timestamp: Date.now(),
      };
      
      // Set the call in WebRTC service
      webrtcService.setCurrentCall(mockCallData);
      
      // Start manual call connection (as receiver)
      await webrtcService.startManualCall(manualCallId.trim(), false);
      
      // Manually trigger incoming call
      const { handleIncomingCall } = useCallStore.getState();
      handleIncomingCall(mockCallData);
      
      Alert.alert('Joined Call', `Joined call with ID: ${manualCallId}\n\nNow answer the call to complete the connection!`);
    } catch (error) {
      console.error('❌ Failed to join call:', error);
      Alert.alert('Error', `Failed to join call: ${error.message || error}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>WebRTC Call Testing</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication Status:</Text>
        <Text style={styles.statusText}>
          {profileData?.id ? '✅ Logged In' : '❌ Not Logged In'}
        </Text>
        {profileData && (
          <Text style={styles.callInfo}>
            User ID: {profileData.id || 'N/A'}
            {'\n'}Role: {profileData.userRole || 'N/A'}
            {'\n'}Name: {profileData.userName || profileData.firstName || 'N/A'}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Call Status:</Text>
        <Text style={styles.statusText}>
          {isIncomingCall ? 'Incoming Call' : 
           isOutgoingCall ? 'Outgoing Call' : 
           isInCall ? 'Call in Progress' : 'No Active Call'}
        </Text>
        {currentCall && (
          <Text style={styles.callInfo}>
            Call ID: {currentCall.callId}
            {'\n'}Type: {currentCall.type}
            {'\n'}Status: {currentCall.status}
          </Text>
        )}
      </View>

      {isIncomingCall && currentCall ? (
        <View style={[styles.section, styles.incomingCallSection]}>
          <Text style={styles.incomingCallTitle}>📞 INCOMING CALL</Text>
          <Text style={styles.sectionTitle}>
            {currentCall.type === 'audio' ? '🔊 Audio' : '📹 Video'} call from User {currentCall.callerId}
          </Text>
          <Text style={styles.callInfo}>
            Call ID: {currentCall.callId}
            {'\n'}Status: {currentCall.status}
          </Text>
          <TouchableOpacity style={styles.answerButton} onPress={handleAnswerIncomingCall}>
            <Text style={styles.buttonText}>✅ Answer Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={handleRejectIncomingCall}>
            <Text style={styles.buttonText}>❌ Reject Call</Text>
          </TouchableOpacity>
        </View>
      ) : isInCall ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call in progress with {currentCall?.receiverId}</Text>
          <TouchableOpacity style={styles.endButton} onPress={handleEndCurrentCall}>
            <Text style={styles.buttonText}>End Call</Text>
          </TouchableOpacity>
        </View>
      ) : profileData?.id ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start a Test Call:</Text>
          <Text style={styles.receiverLabel}>Test Receiver ID:</Text>
          <Text style={styles.receiverId}>{testReceiverId}</Text>
          
          <TouchableOpacity style={styles.videoButton} onPress={handleStartVideoCall}>
            <Text style={styles.buttonText}>Start Video Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.audioButton} onPress={handleStartAudioCall}>
            <Text style={styles.buttonText}>Start Audio Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={async () => {
              try {
                const hasAccess = await webrtcService.testConversationAccess(48);
                Alert.alert(
                  'Conversation Access Test', 
                  hasAccess ? '✅ Can access conversation 48' : '❌ Cannot access conversation 48'
                );
              } catch (error) {
                Alert.alert('Test Error', `Failed to test conversation access: ${error.message}`);
              }
            }}
          >
            <Text style={styles.buttonText}>Test Conversation Access</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={async () => {
              try {
                await webrtcService.checkAndEndActiveCalls(48);
                Alert.alert('Active Calls Check', 'Checked and ended any active calls in conversation 48');
              } catch (error) {
                Alert.alert('Active Calls Error', `Failed to check active calls: ${error.message}`);
              }
            }}
          >
            <Text style={styles.buttonText}>Check & End Active Calls</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={async () => {
              try {
                const { endCall, currentCall } = useCallStore.getState();
                if (currentCall?.callId) {
                  await endCall(currentCall.callId);
                  Alert.alert('Call State Reset', 'Call state has been reset. You can now start a new call.');
                } else {
                  // If no call ID, just reset the state directly
                  const store = useCallStore.getState();
                  store.isInCall = false;
                  store.isIncomingCall = false;
                  store.isOutgoingCall = false;
                  store.currentCall = null;
                  Alert.alert('Call State Reset', 'Call state has been reset (no active call found).');
                }
              } catch (error) {
                Alert.alert('Reset Error', `Failed to reset call state: ${error.message}`);
              }
            }}
          >
            <Text style={styles.buttonText}>Reset Call State</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.debugButton} onPress={forceEnableMicrophone}>
            <Text style={styles.buttonText}>Force Enable Microphone</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.debugButton} onPress={checkMicrophoneStatus}>
            <Text style={styles.buttonText}>Check Microphone Status</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.debugButton} onPress={checkWebRTCConnection}>
            <Text style={styles.buttonText}>Check WebRTC Connection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              webrtcService.debugAudioStatus();
              Alert.alert('Audio Debug', 'Check console logs for detailed audio status');
            }}
          >
            <Text style={styles.buttonText}>Debug Audio Status</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              console.log('📞 Testing incoming call...');
              webrtcService.testIncomingCall();
            }}
          >
            <Text style={styles.buttonText}>Test Incoming Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              console.log('📞 Testing real incoming call...');
              webrtcService.testRealIncomingCall();
            }}
          >
            <Text style={styles.buttonText}>Test Real Incoming Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              console.log('📞 Testing socket event simulation...');
              webrtcService.testSocketEventSimulation();
            }}
          >
            <Text style={styles.buttonText}>Test Socket Event Simulation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              console.log('📞 Force setting up socket listeners...');
              webrtcService.forceSetupSocketListeners();
            }}
          >
            <Text style={styles.buttonText}>Force Setup Socket Listeners</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              console.log('📞 Ending current call...');
              webrtcService.endCurrentCall();
            }}
          >
            <Text style={styles.buttonText}>End Current Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              console.log('📞 Testing call ended event...');
              webrtcService.testCallEndedEvent();
            }}
          >
            <Text style={styles.buttonText}>Test Call Ended Event</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              console.log('📞 Testing call declined event...');
              webrtcService.testCallDeclinedEvent();
            }}
          >
            <Text style={styles.buttonText}>Test Call Declined Event</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              console.log('📞 Testing socket connection...');
              console.log('📞 webrtcService available:', !!webrtcService);
              console.log('📞 testSocketConnection method available:', !!webrtcService.testSocketConnection);
              try {
                webrtcService.testSocketConnection();
                console.log('📞 testSocketConnection called successfully');
              } catch (error) {
                console.error('📞 Error calling testSocketConnection:', error);
              }
            }}
          >
            <Text style={styles.buttonText}>Test Socket Connection</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              console.log('📞 Testing receiver socket connection...');
              try {
                webrtcService.testSocketConnection();
                console.log('📞 Receiver socket test completed');
              } catch (error) {
                console.error('📞 Error testing receiver socket:', error);
              }
            }}
          >
            <Text style={styles.buttonText}>Test Receiver Socket</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              console.log('📞 Force enabling speaker...');
              try {
                webrtcService.toggleSpeaker(true);
                console.log('📞 Speaker force enabled');
              } catch (error) {
                console.error('📞 Error enabling speaker:', error);
              }
            }}
          >
            <Text style={styles.buttonText}>Force Enable Speaker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              console.log('📞 Testing audio streams...');
              const remoteStream = webrtcService.getRemoteStream();
              const localStream = webrtcService.getLocalStream();
              
              console.log('📞 Remote Stream Debug:', {
                exists: !!remoteStream,
                active: remoteStream?.active,
                id: remoteStream?.id,
                url: remoteStream?.toURL(),
                tracks: remoteStream?.getTracks().map(t => ({
                  kind: t.kind,
                  enabled: t.enabled,
                  muted: t.muted,
                  readyState: t.readyState
                }))
              });
              
              console.log('📞 Local Stream Debug:', {
                exists: !!localStream,
                active: localStream?.active,
                id: localStream?.id,
                url: localStream?.toURL(),
                tracks: localStream?.getTracks().map(t => ({
                  kind: t.kind,
                  enabled: t.enabled,
                  muted: t.muted,
                  readyState: t.readyState
                }))
              });
            }}
          >
            <Text style={styles.buttonText}>Debug Audio Streams</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              console.log('📞 Testing audio playback...');
              try {
                // Test if we can create a simple audio stream
                const stream = await webrtcService.testAudioPlayback();
                console.log('📞 Audio playback test result:', stream);
              } catch (error) {
                console.error('📞 Audio playback test failed:', error);
              }
            }}
          >
            <Text style={styles.buttonText}>Test Audio Playback</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              console.log('📞 Force enabling remote audio...');
              try {
                const remoteStream = webrtcService.getRemoteStream();
                if (remoteStream) {
                  const audioTracks = remoteStream.getAudioTracks();
                  console.log('📞 Remote audio tracks found:', audioTracks.length);
                  audioTracks.forEach((track, index) => {
                    console.log(`📞 Track ${index} before:`, {
                      enabled: track.enabled,
                      muted: track.muted,
                      readyState: track.readyState
                    });
                    track.enabled = true;
                    track.muted = false;
                    console.log(`📞 Track ${index} after:`, {
                      enabled: track.enabled,
                      muted: track.muted,
                      readyState: track.readyState
                    });
                  });
                  console.log('📞 ✅ Remote audio tracks force enabled');
                } else {
                  console.log('📞 ❌ No remote stream available');
                }
              } catch (error) {
                console.error('📞 Error force enabling remote audio:', error);
              }
            }}
          >
            <Text style={styles.buttonText}>Force Enable Remote Audio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              console.log('📞 Running comprehensive audio debug...');
              webrtcService.debugAudioIssues();
            }}
          >
            <Text style={styles.buttonText}>Debug Audio Issues</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              webrtcService.forceEnableAllAudio();
              Alert.alert('Audio Force Enabled', 'All audio tracks have been force enabled');
            }}
          >
            <Text style={styles.buttonText}>Force Enable All Audio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              console.log('📞 Testing ringing directly...');
              const { callNotificationService } = require('@app/service/call-notification-service');
              console.log('📞 callNotificationService available:', !!callNotificationService);
              console.log('📞 startRinging method available:', !!callNotificationService.startRinging);
              try {
                callNotificationService.startRinging();
                console.log('📞 startRinging called successfully');
              } catch (error) {
                console.error('📞 Error calling startRinging:', error);
              }
            }}
          >
            <Text style={styles.buttonText}>Test Ringing Directly</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.debugButton} onPress={checkPermissions}>
            <Text style={styles.buttonText}>Check Permissions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.debugButton} onPress={requestPermissions}>
            <Text style={styles.buttonText}>Request Permissions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={async () => {
              const isActive = await webrtcService.testMicrophoneActivation();
              Alert.alert(
                'Microphone Test', 
                isActive ? '✅ Microphone is active and should show in status bar!' : '❌ Microphone is not active'
              );
            }}
          >
            <Text style={styles.buttonText}>Test Microphone Activation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={async () => {
              const isActive = await webrtcService.forceAudioSessionActivation();
              Alert.alert(
                'Force Audio Session', 
                isActive ? '✅ Audio session activated! Check status bar for microphone symbol.' : '❌ Failed to activate audio session'
              );
            }}
          >
            <Text style={styles.buttonText}>Force Audio Session</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              // Simple test - just try to start a call and see if microphone appears
              Alert.alert(
                'Quick Test',
                'Try starting a call now and see if microphone appears in status bar. If not, the issue might be with React Native WebRTC configuration.',
                [
                  { text: 'OK', onPress: () => {
                    console.log('🎤 User will test microphone in status bar');
                  }}
                ]
              );
            }}
          >
            <Text style={styles.buttonText}>Quick Microphone Test</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              console.log('📞 Testing audio debug...');
              const remoteStream = webrtcService.getRemoteStream();
              const localStream = webrtcService.getLocalStream();
              
              console.log('📞 Remote Stream:', {
                exists: !!remoteStream,
                active: remoteStream?.active,
                id: remoteStream?.id,
                url: remoteStream?.toURL(),
                tracks: remoteStream?.getTracks().map(t => ({
                  kind: t.kind,
                  enabled: t.enabled,
                  muted: t.muted,
                  readyState: t.readyState
                }))
              });
              
              console.log('📞 Local Stream:', {
                exists: !!localStream,
                active: localStream?.active,
                id: localStream?.id,
                url: localStream?.toURL(),
                tracks: localStream?.getTracks().map(t => ({
                  kind: t.kind,
                  enabled: t.enabled,
                  muted: t.muted,
                  readyState: t.readyState
                }))
              });
              
              Alert.alert(
                'Audio Debug', 
                `Remote: ${remoteStream ? 'Yes' : 'No'}\nLocal: ${localStream ? 'Yes' : 'No'}\nCheck console for details`
              );
            }}
          >
            <Text style={styles.buttonText}>Debug Audio Streams</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              console.log('📞 Testing WebRTC connection status...');
              const connectionState = webrtcService.getConnectionState();
              const currentCall = webrtcService.getCurrentCall();
              
              console.log('📞 WebRTC Status:', {
                connectionState,
                currentCall,
                hasLocalStream: !!webrtcService.getLocalStream(),
                hasRemoteStream: !!webrtcService.getRemoteStream()
              });
              
              Alert.alert(
                'WebRTC Status', 
                `Connection: ${connectionState}\nCall: ${currentCall?.callId || 'None'}\nLocal: ${webrtcService.getLocalStream() ? 'Yes' : 'No'}\nRemote: ${webrtcService.getRemoteStream() ? 'Yes' : 'No'}`
              );
            }}
          >
            <Text style={styles.buttonText}>Check WebRTC Status</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={async () => {
              console.log('📞 Testing local stream creation...');
              try {
                // Try to get user media directly
                const webrtc = require('react-native-webrtc');
                const stream = await webrtc.mediaDevices.getUserMedia({
                  audio: true,
                  video: false
                });
                
                console.log('📞 Direct getUserMedia result:', {
                  active: stream.active,
                  id: stream.id,
                  tracks: stream.getTracks().map(t => ({
                    kind: t.kind,
                    enabled: t.enabled,
                    readyState: t.readyState
                  }))
                });
                
                Alert.alert(
                  'Local Stream Test', 
                  `Stream created: ${stream.active ? 'Yes' : 'No'}\nTracks: ${stream.getTracks().length}\nCheck console for details`
                );
                
                // Clean up
                stream.getTracks().forEach(track => track.stop());
              } catch (error) {
                console.error('📞 Direct getUserMedia failed:', error);
                Alert.alert('Error', `Failed to get user media: ${error.message}`);
              }
            }}
          >
            <Text style={styles.buttonText}>Test Local Stream</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={async () => {
              console.log('📞 Testing backend signaling...');
              try {
                // Test if we can send signaling data to backend
                const testCallId = 'test_call_123';
                const testData = {
                  type: 'test',
                  data: { test: 'data' }
                };
                
                // Test backend signaling without auth token (will likely return 401, but that's OK for testing)
                const response = await fetch(`https://api.gofrts.com/api/v1/webrtc/calls/${testCallId}/signaling`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(testData)
                });
                
                console.log('📞 Backend signaling test response:', {
                  status: response.status,
                  ok: response.ok,
                  statusText: response.statusText
                });
                
                Alert.alert(
                  'Backend Signaling Test', 
                  `Status: ${response.status}\nOK: ${response.ok}\nCheck console for details`
                );
              } catch (error) {
                console.error('📞 Backend signaling test failed:', error);
                Alert.alert('Error', `Backend signaling failed: ${error.message}`);
              }
            }}
          >
            <Text style={styles.buttonText}>Test Backend Signaling</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.debugButton} 
            onPress={() => {
              Alert.alert(
                'WebRTC Configuration Issue',
                'The microphone not showing in status bar is likely a React Native WebRTC configuration issue. This is common and doesn\'t prevent audio from working. Try the call anyway - audio should still work even without the status bar indicator.',
                [
                  { text: 'Try Call Anyway', onPress: () => {
                    console.log('🎤 User will try call despite status bar issue');
                  }}
                ]
              );
            }}
          >
            <Text style={styles.buttonText}>Status Bar Issue Info</Text>
          </TouchableOpacity>
          
          <View style={styles.manualCallSection}>
            <Text style={styles.sectionTitle}>Manual Call Testing:</Text>
            <Text style={styles.instructionText}>
              Enter a call ID from Device A to join the call manually
            </Text>
            <TextInput
              style={styles.callIdInput}
              placeholder="Enter call ID (e.g., call_1760028689670_5hcgd1n4w)"
              value={manualCallId}
              onChangeText={setManualCallId}
              placeholderTextColor={Colors.gray600}
            />
            <TouchableOpacity style={styles.debugButton} onPress={joinCallWithId}>
              <Text style={styles.buttonText}>Join Call with ID</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.debugButton} 
              onPress={() => {
                if (offerData.trim()) {
                  try {
                    const parsedOffer = JSON.parse(offerData);
                    webrtcService.setManualOfferData({ callId: manualCallId, offer: parsedOffer, timestamp: Date.now() });
                    Alert.alert('Success', 'Offer data set manually!');
                  } catch (error) {
                    Alert.alert('Error', 'Invalid JSON in offer data');
                  }
                } else {
                  Alert.alert('Error', 'Please enter offer data first');
                }
              }}
            >
              <Text style={styles.buttonText}>Set Offer Data Manually</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.debugButton} 
              onPress={async () => {
                if (answerData.trim()) {
                  try {
                    const parsedAnswer = JSON.parse(answerData);
                    webrtcService.setManualAnswerData({ callId: manualCallId, answer: parsedAnswer, timestamp: Date.now() });
                    
                    // Check if we're the caller or receiver
                    const isInitiator = webrtcService.isCallInitiator();
                    console.log('📞 WebRTC Test Screen: Is initiator:', isInitiator);
                    
                    if (isInitiator) {
                      // We're the caller, complete the connection
                      await webrtcService.completeManualCall(manualCallId);
                      Alert.alert('Success', 'Connection completed as caller!');
                    } else {
                      // We're the receiver, just set the answer data
                      Alert.alert('Success', 'Answer data set! The caller needs to complete the connection.');
                    }
                  } catch (error) {
                    Alert.alert('Error', `Failed to complete connection: ${error.message}`);
                  }
                } else {
                  Alert.alert('Error', 'Please enter answer data first');
                }
              }}
            >
              <Text style={styles.buttonText}>Complete Connection with Answer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.debugButton} 
              onPress={async () => {
                try {
                  const answerData = await webrtcService.getStoredAnswer(manualCallId || 'current');
                  if (answerData) {
                    const answerJson = JSON.stringify(answerData.answer, null, 2);
                    setAnswerData(answerJson);
                    Alert.alert('Answer Data Retrieved', 'Answer data has been loaded into the text field below.');
                  } else {
                    Alert.alert('No Answer Data', 'No answer data found. Make sure you have answered a call first.');
                  }
                } catch (error) {
                  Alert.alert('Error', `Failed to get answer data: ${error.message}`);
                }
              }}
            >
              <Text style={styles.buttonText}>Get Answer Data</Text>
            </TouchableOpacity>
            
            <Text style={styles.sectionTitle}>Manual Data Exchange:</Text>
            <Text style={styles.instructionText}>
              For manual testing, copy and paste the offer/answer data between devices
            </Text>
            
            <Text style={styles.inputLabel}>Offer Data (from caller):</Text>
            <TextInput
              style={[styles.callIdInput, styles.multilineInput]}
              placeholder="Paste offer data from Device A here..."
              value={offerData}
              onChangeText={setOfferData}
              placeholderTextColor={Colors.gray600}
              multiline={true}
              numberOfLines={4}
            />
            
            <Text style={styles.inputLabel}>Answer Data (from receiver):</Text>
            <TextInput
              style={[styles.callIdInput, styles.multilineInput]}
              placeholder="Paste answer data from Device B here..."
              value={answerData}
              onChangeText={setAnswerData}
              placeholderTextColor={Colors.gray600}
              multiline={true}
              numberOfLines={4}
            />
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication Required</Text>
          <Text style={styles.instructionText}>
            Please log in to your account first to test WebRTC calling functionality.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions:</Text>
        <Text style={styles.instructionText}>
          1. Make sure you have camera and microphone permissions{'\n'}
          2. Start a call using the buttons above{'\n'}
          3. The call will open in the CallScreen{'\n'}
          4. Test the call controls (mute, video, speaker){'\n'}
          5. End the call when done
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.primary,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: Colors.black,
  },
  statusText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  callInfo: {
    fontSize: 14,
    color: Colors.gray600,
    marginTop: 10,
  },
  receiverLabel: {
    fontSize: 16,
    color: Colors.gray600,
    marginBottom: 5,
  },
  receiverId: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 15,
  },
  videoButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  audioButton: {
    backgroundColor: Colors.secondary,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  debugButton: {
    backgroundColor: Colors.gray600,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  incomingCallSection: {
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.success,
    borderStyle: 'dashed',
  },
  incomingCallTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.white,
    marginBottom: 10,
  },
  manualCallSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
  },
  callIdInput: {
    borderWidth: 1,
    borderColor: Colors.gray400,
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
    backgroundColor: Colors.white,
    color: Colors.black,
  },
  answerButton: {
    backgroundColor: Colors.success,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  rejectButton: {
    backgroundColor: Colors.error,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  endButton: {
    backgroundColor: Colors.error,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: Colors.gray600,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 5,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});

export default WebRTCTestScreen;

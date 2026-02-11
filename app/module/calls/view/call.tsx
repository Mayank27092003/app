/**
 * Call Screen
 * @format
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  User,
  ArrowLeft,
  Clock,
  Video,
  VideoOff,
} from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { RTCView } from 'react-native-webrtc';

//Screens
import { Colors } from '@app/styles';
import { useAuthStore } from '@app/store/authStore';
import { useChatStore } from '@app/store/chatStore';
import { useCallStore } from '@app/store/callStore';
import { webrtcService } from '@app/service/webrtc-service';
import { Call } from '@app/types';
import { useThemedStyle } from '@app/styles';
import { getStyles } from './styles';
import { log } from '@app/utils/log';

type RootStackParamList = {
  CallScreen: { 
    callId?: string;
    receiverId: string;
    callType?: 'audio' | 'video';
    isBackendCall?: boolean; // Flag to indicate backend-initiated call
    conversationId?: number; // For backend calls
  };
};
type CallScreenRouteProp = RouteProp<RootStackParamList, 'CallScreen'>;

function CallScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const route = useRoute<CallScreenRouteProp>();

  const { receiverId, callType = 'video', isBackendCall = false, conversationId, callId } = route.params;
  console.log('📞 CallScreen: Route params:', route.params);

  const { userProfile } = useAuthStore();
  const {
    isInCall,
    isIncomingCall,
    isOutgoingCall,
    currentCall,
    isMuted,
    isVideoEnabled,
    isSpeakerEnabled,
    initiateCall,
    answerCall,
    endCall,
    rejectCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
  } = useCallStore();

  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize call when component mounts
  useEffect(() => {
    const initializeCall = async () => {
      try {
        if (isBackendCall) {
          // For backend-initiated calls, the call is already started
          console.log('📞 CallScreen: Backend call already initiated, callId:', callId);
          setIsConnecting(false);
          
          // Check if there's already an active call and clean it up
          const { isInCall, currentCall, endCall } = useCallStore.getState();
          if (isInCall && currentCall && currentCall.callId !== callId) {
            console.log('📞 CallScreen: Cleaning up existing call:', currentCall.callId);
            await endCall(currentCall.callId);
          }
          
          // Set the call state for backend calls
          const { handleCallAnswered } = useCallStore.getState();
          const callData = {
            callId: callId || '',
            callerId: userProfile?.id?.toString() || '',
            receiverId: receiverId,
            type: callType,
            status: 'answered', // Set as answered since it's initiated
            timestamp: Date.now(),
          };
          
          console.log('📞 CallScreen: Setting call data for backend call:', callData);
          handleCallAnswered(callData);
          
          // Also set the call state directly to ensure it's active
          const { isInCall: newIsInCall, currentCall: newCurrentCall } = useCallStore.getState();
          console.log('📞 CallScreen: Call state after setting:', { isInCall: newIsInCall, currentCall: newCurrentCall });
          
          return;
        }
        
        if (receiverId && !isInCall && !isIncomingCall) {
          console.log('📞 CallScreen: Initializing legacy call to:', receiverId);
          setIsConnecting(true);
          
          await initiateCall(receiverId, callType);
          setIsConnecting(false);
        }
      } catch (error) {
        console.error('❌ CallScreen: Failed to initialize call:', error);
        setIsConnecting(false);
        Alert.alert(t("common.callFailed"), t("common.unableToStartCall"));
        navigation.goBack();
      }
    };

    initializeCall();
  }, [receiverId, callType, isBackendCall, callId]);

  // Handle call duration timer
  useEffect(() => {
    if (isInCall && currentCall) {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isInCall, currentCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      
      // Clean up call state when component unmounts
      if (isBackendCall && callId) {
        console.log('📞 CallScreen: Cleaning up backend call state on unmount');
        const { endCall } = useCallStore.getState();
        endCall(callId);
      }
    };
  }, [isBackendCall]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerCall = async () => {
    try {
      if (!currentCall) return;
      
      console.log('📞 CallScreen: Answering call');
      await answerCall(currentCall.callId, callType);
    } catch (error) {
      console.error('❌ CallScreen: Failed to answer call:', error);
      Alert.alert(t("common.callFailed"), t("common.unableToAnswerCall"));
    }
  };

  const handleEndCall = async () => {
    console.log('📞 CallScreen: Ending call');
    
    if (isBackendCall && callId) {
      // Use backend API to end the call
      try {
        await webrtcService.endCall(callId);
        console.log('✅ Call ended via backend API');
      } catch (error) {
        console.error('❌ Failed to end call via backend API:', error);
      }
    } else {
      // Use legacy end call method
      endCall();
    }
    
    navigation.goBack();
  };

  const handleRejectCall = () => {
    if (!currentCall) return;
    
    console.log('📞 CallScreen: Rejecting call');
    rejectCall(currentCall.callId);
    navigation.goBack();
  };

  const handleToggleMute = () => {
    toggleMute();
  };

  const handleToggleVideo = () => {
    toggleVideo();
  };

  const handleToggleSpeaker = () => {
    toggleSpeaker();
  };


  const getContactName = () => {
    if (!currentCall) return 'Unknown User';
    
    // For backend calls, show a more meaningful name
    if (isBackendCall) {
      return `Conversation ${currentCall.receiverId}`;
    }
    
    return currentCall.receiverId; // You can enhance this to get actual name
  };

  const getCallStatus = () => {
    if (isConnecting) return 'Connecting...';
    if (isIncomingCall) return 'Incoming call...';
    if (isOutgoingCall) return 'Calling...';
    if (isInCall) return 'Call in progress 9';
    
    // For backend calls, show active status
    if (isBackendCall && currentCall) {
      return 'Call in progress 8';
    }
    
    return 'Call ended';
  };

  return (
    <View style={styles.container}>
      {/* Audio/Video Views */}
      {isInCall && webrtcService.getRemoteStream() && (
        <View style={styles.videoContainer}>
          {/* Remote Stream (Audio + Video) */}
          <RTCView
            style={callType === 'video' ? styles.remoteVideo : styles.audioView}
            streamURL={webrtcService.getRemoteStream()?.toURL() || ''}
            mirror={false}
            objectFit="cover"
            zOrder={0}
            // Force audio playback - this is the key fix
            audio={true}
            video={callType === 'video'}
            onLoad={() => {
              log('📞 CallScreen: Remote RTCView loaded');
              console.log('📞 CallScreen: Stream URL:', webrtcService.getRemoteStream()?.toURL());
              console.log('📞 CallScreen: Audio enabled:', true);
              console.log('📞 CallScreen: Call type:', callType);
              
              // Force audio playback and session activation
              setTimeout(() => {
                console.log('📞 CallScreen: Forcing audio playback...');
                if (webrtcService.getRemoteStream()) {
                  const audioTracks = webrtcService.getRemoteStream()!.getAudioTracks();
                  console.log('📞 CallScreen: Remote audio tracks:', audioTracks.length);
                  audioTracks.forEach((track, index) => {
                    console.log(`📞 CallScreen: Track ${index}:`, {
                      enabled: track.enabled,
                      muted: track.muted,
                      readyState: track.readyState
                    });
                    // Force enable the track
                    track.enabled = true;
                    track.muted = false;
                  });
                  
                  // Force audio session activation
                  webrtcService.forceAudioSessionActivation();
                }
              }, 1000);
            }}
            onError={(error) => log('ERROR:📞 CallScreen: Remote RTCView error:', error)}
          />
          
          {/* Local Stream (Audio + Video) */}
          {webrtcService.getLocalStream() && (
            <RTCView
              style={callType === 'video' && isVideoEnabled ? styles.localVideo : styles.audioView}
              streamURL={webrtcService.getLocalStream()?.toURL() || ''}
              mirror={true}
              objectFit="cover"
              zOrder={1}
              audio={true}
              video={callType === 'video'}
              onLoad={() => {
                console.log('📞 CallScreen: Local RTCView loaded');
                console.log('📞 CallScreen: Local stream URL:', webrtcService.getLocalStream()?.toURL());
              }}
              onError={(error) => console.error('📞 CallScreen: Local RTCView error:', error)}
            />
          )}
        </View>
      )}



      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>

        {currentCall?.callId ? (
          <View style={styles.jobBadge}>
            <Text style={styles.jobBadgeText}>
              Call #{currentCall.callId.substring(0, 8)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Contact Info */}
      <View style={styles.contactContainer}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User size={40} color={Colors.white} />
          </View>
        </View>

        <Text style={styles.contactName}>{getContactName()}</Text>

        <Text style={styles.callStatus}>{getCallStatus()}</Text>

        {isInCall && (
          <View style={styles.durationContainer}>
            <Clock size={16} color={Colors.white} style={styles.durationIcon} />
            <Text style={styles.duration}>
              {formatDuration(callDuration)}
            </Text>
          </View>
        )}
      </View>

      {/* Media Controls */}
      {isInCall && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isMuted && styles.actionButtonActive,
            ]}
            onPress={handleToggleMute}
          >
            {isMuted ? (
              <MicOff size={24} color={Colors.white} />
            ) : (
              <Mic size={24} color={Colors.white} />
            )}
            <Text style={styles.actionText}>
              {isMuted ? 'Unmute' : 'Mute'}
            </Text>
          </TouchableOpacity>

          {callType === 'video' && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                !isVideoEnabled && styles.actionButtonActive,
              ]}
              onPress={handleToggleVideo}
            >
              {isVideoEnabled ? (
                <Video size={24} color={Colors.white} />
              ) : (
                <VideoOff size={24} color={Colors.white} />
              )}
              <Text style={styles.actionText}>
                {isVideoEnabled ? 'Video On' : 'Video Off'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              isSpeakerEnabled && styles.actionButtonActive,
            ]}
            onPress={handleToggleSpeaker}
          >
            {isSpeakerEnabled ? (
              <Volume2 size={24} color={Colors.white} />
            ) : (
              <VolumeX size={24} color={Colors.white} />
            )}
            <Text style={styles.actionText}>
              {isSpeakerEnabled ? 'Speaker' : 'Earpiece'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Call Control Buttons */}
      <View style={styles.callButtonsContainer}>
        {isIncomingCall ? (
          <>
            <TouchableOpacity
              style={[styles.callButton, styles.declineButton]}
              onPress={handleRejectCall}
            >
              <PhoneOff size={32} color={Colors.white} />
            </TouchableOpacity>

          </>
        ) : isInCall ? (
          <TouchableOpacity
            style={[styles.callButton, styles.endButton]}
            onPress={handleEndCall}
          >
            <PhoneOff size={32} color={Colors.white} />
          </TouchableOpacity>
        ) : isConnecting ? (
          <View style={styles.connectingContainer}>
            <Text style={styles.connectingText}>Connecting...</Text>
          </View>
        ) : null}
      </View>

      {/* Call Recording Notice */}
      {isInCall && (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingIndicator} />
          <Text style={styles.recordingText}>
            This call is being recorded for quality and transparency purposes
          </Text>
        </View>
      )}
    </View>
  );
}

export { CallScreen };

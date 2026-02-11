import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Phone, PhoneOff, Video } from 'lucide-react-native';
// import { useCallStore } from '@app/store/callStore';
import { webrtcService } from '@app/service/webrtc-service';
import { callNotificationService } from '@app/service/call-notification-service';
import { Colors } from '@app/styles';
// Temporarily commented out  
// import { callNotificationService } from '@app/service/call-notification-service';

const { width, height } = Dimensions.get('window');

interface IncomingCallScreenProps {
  callData: {
    callId: string;
    callerId: string;
    receiverId: string;
    type: 'audio' | 'video';
    status: string;
    timestamp: number;
  };
}

const IncomingCallScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { callData } = route.params as { callData: any };
  
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  
  // Call store is used for state management
  // const { acceptCall, rejectCall, currentCall } = useCallStore();

  useEffect(() => {
    console.log('📞 IncomingCallScreen: Received call data:', callData);
    
    // Set status bar to show incoming call
    StatusBar.setBarStyle('light-content', true);
    
    return () => {
      // Reset status bar when component unmounts
      StatusBar.setBarStyle('dark-content', true);
    };
  }, [callData]);

  const handleAcceptCall = async () => {
    try {
      setIsAccepting(true);
      console.log('📞 IncomingCallScreen: Accepting call:', callData.callId);
      
      // Stop ringing
      callNotificationService.stopRinging();
      
      // Accept call via backend API
      await webrtcService.acceptCall(callData.callId);
      
      console.log('📞 IncomingCallScreen: Call accepted, navigating to CallScreen...');
      console.log('📞 IncomingCallScreen: Navigation params:', {
        callId: callData.callId,
        receiverId: callData.callerId,
        callType: callData.type,
        isBackendCall: true,
        conversationId: callData.receiverId
      });
      
      // Navigate to call screen
      try {
        (navigation as any).replace('CallScreen', {
          callId: callData.callId,
          receiverId: callData.callerId,
          callType: callData.type,
          isBackendCall: true,
          conversationId: callData.receiverId
        });
        console.log('✅ IncomingCallScreen: Navigation to CallScreen successful');
      } catch (navError) {
        console.error('❌ IncomingCallScreen: Navigation failed:', navError);
        throw navError;
      }
      
    } catch (error) {
      console.error('❌ IncomingCallScreen: Failed to accept call:', error);
      Alert.alert(t("common.callError"), `${t("common.failedToAcceptCall") || "Failed to accept call"}: ${error.message}`);
      setIsAccepting(false);
    }
  };

  const handleDeclineCall = async () => {
    try {
      setIsDeclining(true);
      console.log('📞 IncomingCallScreen: Declining call:', callData.callId);
      
      // Stop ringing
      callNotificationService.stopRinging();
      
      // Decline call via backend API
      await webrtcService.declineCall(callData.callId, 'User declined');
      
      // Go back to previous screen
      navigation.goBack();
      
    } catch (error) {
      console.error('❌ IncomingCallScreen: Failed to decline call:', error);
      Alert.alert(t("common.callError"), `${t("common.failedToDeclineCall") || "Failed to decline call"}: ${error.message}`);
      setIsDeclining(false);
    }
  };

  const getCallerName = () => {
    // In a real app, you'd fetch the caller's name from your user store
    return `User ${callData.callerId}`;
  };

  const getCallTypeText = () => {
    return callData.type === 'video' ? 'Video Call' : 'Audio Call';
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incoming Call</Text>
        <Text style={styles.headerSubtitle}>{getCallTypeText()}</Text>
      </View>

      {/* Caller Info */}
      <View style={styles.callerInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getCallerName().charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.callerName}>{getCallerName()}</Text>
        <Text style={styles.callerId}>ID: {callData.callerId}</Text>
      </View>

      {/* Call Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.declineButton]}
          onPress={handleDeclineCall}
          disabled={isDeclining || isAccepting}
        >
          <PhoneOff size={32} color={Colors.white} />
          <Text style={styles.controlButtonText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.acceptButton]}
          onPress={handleAcceptCall}
          disabled={isAccepting || isDeclining}
        >
          {callData.type === 'video' ? (
            <Video size={32} color={Colors.white} />
          ) : (
            <Phone size={32} color={Colors.white} />
          )}
          <Text style={styles.controlButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>

      {/* Call Status */}
      <View style={styles.status}>
        <Text style={styles.statusText}>
          {(() => {
            if (isAccepting) return 'Accepting...';
            if (isDeclining) return 'Declining...';
            return 'Incoming call';
          })()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.8,
  },
  callerInfo: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  callerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  callerId: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.7,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  acceptButton: {
    backgroundColor: Colors.success,
  },
  declineButton: {
    backgroundColor: Colors.error,
  },
  controlButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  status: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.8,
  },
});

export default IncomingCallScreen;

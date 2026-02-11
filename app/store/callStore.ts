/**
 * Call Store for WebRTC State Management
 * @format
 */

import { create } from 'zustand';
import { CallData } from '../service/webrtc-service';
import { NavigationService } from '../helpers/navigation-service';

// Import WebRTC service with error handling
let webrtcService: any = null;
try {
  const webrtcModule = require('../service/webrtc-service');
  webrtcService = webrtcModule.webrtcService;
} catch (error) {
  console.warn('⚠️ WebRTC service not available:', error);
}

export interface CallState {
  // Call status
  isInCall: boolean;
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  currentCall: CallData | null;
  
  // Media controls
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeakerEnabled: boolean;
  
  // Call history
  callHistory: CallData[];
  
  // Actions - Updated for Backend API
  initiateCall: (conversationId: number, type: 'audio' | 'video', isGroupCall?: boolean) => Promise<any>;
  answerCall: (callSessionId: string, type: 'audio' | 'video') => Promise<any>;
  endCall: (callSessionId?: string) => Promise<void>;
  rejectCall: (callSessionId: string, reason?: string) => Promise<void>;
  joinGroupCall: (callSessionId: string) => Promise<any>;
  
  // Media controls
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  
  // Call events
  handleIncomingCall: (callData: CallData) => void;
  handleCallAnswered: (callData: CallData) => void;
  handleCallRejected: (callData: CallData) => void;
  handleCallEnded: (callData: CallData) => void;
  
  // Reset
  resetCallState: () => void;
  
  // WebRTC event listeners
  initWebRTCEventListeners: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  // Initial state
  isInCall: false,
  isIncomingCall: false,
  isOutgoingCall: false,
  currentCall: null,
  isMuted: false,
  isVideoEnabled: true,
  isSpeakerEnabled: false,
  callHistory: [],

  // Initialize WebRTC event listeners
  initWebRTCEventListeners: () => {
    if (!webrtcService) return;
    
    // Listen for incoming calls
    webrtcService.on('call_invitation', (data: any) => {
      console.log('📞 CallStore: Received call invitation from WebRTC service');
      const { handleIncomingCall } = get();
      handleIncomingCall(data);
    });
    
    // Listen for call answers
    webrtcService.on('call_answer', (data: any) => {
      console.log('📞 CallStore: Received call answer from WebRTC service');
      const { handleCallAnswered } = get();
      handleCallAnswered(data);
    });
    
    // Listen for call rejections
    webrtcService.on('call_reject', (data: any) => {
      console.log('📞 CallStore: Received call rejection from WebRTC service');
      const { handleCallRejected } = get();
      handleCallRejected(data);
    });
    
    // Listen for call ends
    webrtcService.on('call_end', (data: any) => {
      console.log('📞 CallStore: Received call end from WebRTC service');
      const { handleCallEnded } = get();
      handleCallEnded(data);
    });
  },

  // Initiate a new call via Backend API
  initiateCall: async (conversationId: number, type: 'audio' | 'video', isGroupCall?: boolean) => {
    try {
      console.log('📞 CallStore: Initiating call via backend API:', { conversationId, type, isGroupCall });
      
      if (!webrtcService) {
        throw new Error('WebRTC service not available. Please ensure react-native-webrtc is properly installed.');
      }
      
      const result = await webrtcService.initiateCall(conversationId, type, isGroupCall);
      
      // Create call data from backend response
      const callData: CallData = {
        callId: result.data.id.toString(),
        callerId: result.data.callerId.toString(),
        receiverId: conversationId.toString(),
        type: type,
        status: 'initiating',
        timestamp: Date.now(),
      };
      
      set({
        isOutgoingCall: true,
        currentCall: callData,
      });
      
      return result;
    } catch (error) {
      console.error('❌ CallStore: Failed to initiate call:', error);
      throw error;
    }
  },

  // Answer an incoming call via Backend API
  answerCall: async (callSessionId: string, type: 'audio' | 'video') => {
    try {
      console.log('📞 CallStore: Answering call via backend API:', callSessionId);
      if (!webrtcService) {
        throw new Error('WebRTC service not available. Please ensure react-native-webrtc is properly installed.');
      }
      const result = await webrtcService.acceptCall(callSessionId);
      // DO NOT set isInCall to true here
      // Only set isInCall when call is actually confirmed answered (i.e., after signaling/callback)
      return result;
    } catch (error) {
      console.error('❌ CallStore: Failed to answer call:', error);
      throw error;
    }
  },

  // End the current call via Backend API
  endCall: async (callSessionId?: string) => {
    try {
      console.log('📞 CallStore: Ending call via backend API:', callSessionId);
      
      const { currentCall } = get();
      const sessionId = callSessionId || currentCall?.callId;
      
      if (!sessionId) {
        console.warn('⚠️ CallStore: No call session ID provided for ending call');
        return;
      }
      
      if (webrtcService) {
        await webrtcService.endCall(sessionId);
      }
      
      // Add to call history
      if (currentCall) {
        const updatedCall = { ...currentCall, status: 'ended' as const };
        set(state => ({
          callHistory: [...state.callHistory, updatedCall],
        }));
      }
      
      set({
        isInCall: false,
        isIncomingCall: false,
        isOutgoingCall: false,
        currentCall: null,
        isMuted: false,
        isVideoEnabled: true,
        isSpeakerEnabled: false,
      });
    } catch (error) {
      console.error('❌ CallStore: Failed to end call:', error);
    }
  },

  // Reject an incoming call via Backend API
  rejectCall: async (callSessionId: string, reason?: string) => {
    try {
      console.log('📞 CallStore: Rejecting call via backend API:', { callSessionId, reason });
      
      if (webrtcService) {
        await webrtcService.declineCall(callSessionId, reason);
      }
      
      set({
        isIncomingCall: false,
        currentCall: null,
      });
    } catch (error) {
      console.error('❌ CallStore: Failed to reject call:', error);
    }
  },

  // Join a group call via Backend API
  joinGroupCall: async (callSessionId: string) => {
    try {
      console.log('📞 CallStore: Joining group call via backend API:', callSessionId);
      
      if (!webrtcService) {
        throw new Error('WebRTC service not available. Please ensure react-native-webrtc is properly installed.');
      }
      
      const result = await webrtcService.joinGroupCall(callSessionId);
      
      set({
        isInCall: true,
        isIncomingCall: false,
        isOutgoingCall: false,
      });
      
      return result;
    } catch (error) {
      console.error('❌ CallStore: Failed to join group call:', error);
      throw error;
    }
  },

  // Toggle mute
  toggleMute: () => {
    const { isMuted } = get();
    const newMuteState = !isMuted;
    
    if (webrtcService) {
      const audioEnabled = webrtcService.toggleAudio();
      set({ isMuted: !audioEnabled });
      console.log('📞 CallStore: Audio toggled, enabled:', audioEnabled);
    } else {
      set({ isMuted: newMuteState });
      console.log('📞 CallStore: WebRTC service not available, using local state');
    }
  },

  // Toggle video
  toggleVideo: () => {
    const { isVideoEnabled } = get();
    const newVideoState = !isVideoEnabled;
    
    if (webrtcService) {
      const videoEnabled = webrtcService.toggleVideo();
      set({ isVideoEnabled: videoEnabled });
      console.log('📞 CallStore: Video toggled, enabled:', videoEnabled);
    } else {
      set({ isVideoEnabled: newVideoState });
      console.log('📞 CallStore: WebRTC service not available, using local state');
    }
  },

  // Toggle speaker
  toggleSpeaker: () => {
    const { isSpeakerEnabled } = get();
    const newSpeakerState = !isSpeakerEnabled;
    
    // Toggle speaker using webrtcService (InCallManager)
    if (webrtcService) {
      webrtcService.toggleSpeaker(newSpeakerState);
    }
    
    set({ isSpeakerEnabled: newSpeakerState });
    console.log('📞 CallStore: Speaker toggled, enabled:', newSpeakerState);
  },

  // Handle incoming call
  handleIncomingCall: (callData: CallData) => {
    console.log('📞 CallStore: Incoming call:', callData);
    set({
      isIncomingCall: true,
      isInCall: false, // always reset to false if ringing
      currentCall: callData,
    });
    try {
      console.log('📞 CallStore: Attempting to navigate to IncomingCallScreen...');
      NavigationService.navigate('IncomingCallScreen', { callData });
      console.log('✅ CallStore: Navigated to incoming call screen');
    } catch (error) {
      console.error('❌ CallStore: Failed to navigate to incoming call screen:', error);
      console.error('❌ CallStore: Error details:', error.message, error.stack);
    }
  },

  // Handle call answered
  handleCallAnswered: (callData: CallData) => {
    console.log('📞 CallStore: Call answered:', callData);
    set({
      isInCall: true, // timer should only start NOW
      isOutgoingCall: false,
      isIncomingCall: false,
      currentCall: callData,
    });
  },

  // Handle call rejected
  handleCallRejected: (callData: CallData) => {
    console.log('📞 CallStore: Call rejected:', callData);
    
    set({
      isOutgoingCall: false,
      currentCall: null,
    });
  },

  // Handle call ended
  handleCallEnded: (callData: CallData) => {
    console.log('📞 CallStore: Call ended:', callData);
    
    set({
      isInCall: false,
      isIncomingCall: false,
      isOutgoingCall: false,
      currentCall: null,
    });
  },

  // Reset call state
  resetCallState: () => {
    console.log('📞 CallStore: Resetting call state');
    
    set({
      isInCall: false,
      isIncomingCall: false,
      isOutgoingCall: false,
      currentCall: null,
      isMuted: false,
      isVideoEnabled: true,
      isSpeakerEnabled: false,
    });
  },
}));

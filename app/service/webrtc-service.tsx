/**
 * WebRTC Service for Video/Audio Calling
 * @format
 */
import InCallManager from 'react-native-incall-manager';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
} from 'react-native-webrtc';
import type RTCIceCandidateEvent from 'react-native-webrtc/lib/typescript/RTCIceCandidateEvent';
import type RTCTrackEvent from 'react-native-webrtc/lib/typescript/RTCTrackEvent';
import type { RTCSessionDescriptionInit } from 'react-native-webrtc/lib/typescript/RTCSessionDescription';

// Type augmentation for RTCPeerConnection event methods
// The react-native-webrtc types extend EventTarget but TS doesn't recognize the methods
declare module 'react-native-webrtc' {
  interface RTCPeerConnection {
    addEventListener<K extends keyof RTCPeerConnectionEventMap>(
      type: K,
      listener: (event: RTCPeerConnectionEventMap[K]) => void
    ): void;
    removeEventListener<K extends keyof RTCPeerConnectionEventMap>(
      type: K,
      listener: (event: RTCPeerConnectionEventMap[K]) => void
    ): void;
  }
}

// RTCPeerConnection event map type
interface RTCPeerConnectionEventMap {
  connectionstatechange: Event;
  icecandidate: RTCIceCandidateEvent<'icecandidate'>;
  icecandidateerror: RTCIceCandidateEvent<'icecandidateerror'>;
  iceconnectionstatechange: Event;
  icegatheringstatechange: Event;
  negotiationneeded: Event;
  signalingstatechange: Event;
  track: RTCTrackEvent<'track'>;
  error: Event;
}

// WebRTC availability flag
let webrtcAvailable = false;
console.log('📞 InCall methods:', Object.keys(InCallManager));
console.log('📞 InCall.start:', typeof InCallManager.start);
console.log('📞 InCall.setSpeakerphoneOn:', typeof InCallManager.setSpeakerphoneOn);
try {
  // Test if RTCPeerConnection works
  const testPc = new RTCPeerConnection({});
  testPc.close();
  webrtcAvailable = true;
  console.log('✅ WebRTC modules loaded successfully');
} catch (error) {
  console.warn('⚠️ WebRTC modules not available:', error);
  webrtcAvailable = false;
}

// Import InCallManager for audio routing
// let InCallManager: any;
let inCallManagerAvailable = false;

try {
  // InCallManager = require('react-native-incall-manager');
  inCallManagerAvailable = true;
  console.log('✅ InCallManager loaded successfully');
  console.log('📞 InCallManager methods:', Object.keys(InCallManager));
  console.log('📞 InCallManager type:', typeof InCallManager);

  // Check if the methods are actually available
  if (typeof InCallManager.setSpeakerphoneOn === 'function' && typeof InCallManager.start === 'function') {
    console.log('📞 InCallManager setSpeakerphoneOn:', typeof InCallManager.setSpeakerphoneOn);

    console.log('📞 InCallManager start:', typeof InCallManager.start);
  } else {
    console.warn('⚠️ InCallManager methods not available - package not properly linked');
    inCallManagerAvailable = false;
  }
} catch (error) {
  console.warn('⚠️ InCallManager not available:', error);
  inCallManagerAvailable = false;
}

import { socketService } from './socket-service';
import { callNotificationService } from './call-notification-service';

export interface RTCIceServer {
  credential?: string;
  urls: string | string[];
  url: string | undefined;
  username?: string;
}
export interface CallData {
  callId: string;
  callerId: string;
  receiverId: string;
  conversationId?: string; // Added to store conversation ID
  type: 'audio' | 'video';
  status: 'initiated' | 'initiating' | 'ringing' | 'answered' | 'ended' | 'rejected';
  timestamp: number;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize: number;
}

// Socket event data interfaces
interface IncomingCallEventData {
  callSessionId: number | string;
  conversationId: number | string;
  callerId: number | string;
  receiverId?: number | string;
  callType: 'audio' | 'video';
  isGroupCall?: boolean;
}

interface CallSessionEventData {
  callSessionId: number | string;
  conversationId?: number | string;
}

interface SignalingEventData {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
}

// Call event data type for event emitting
type CallEventData =
  | IncomingCallEventData
  | CallSessionEventData
  | SignalingEventData
  | { callId: string; callerId: string; receiverId: string; type: 'audio' | 'video' }
  | CallData
  | { localStream?: MediaStream; remoteStream?: MediaStream }
  | { error?: string; message?: string };

// API Response interfaces
interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

interface CallInitiateResponse {
  id: number;
  callerId: number;
  status: string;
  callType: 'audio' | 'video';
}

interface CallActionResponse {
  id: number;
  status: string;
}

interface Participant {
  id: number;
  user?: {
    id: number;
    name?: string;
  };
}

interface ConversationData {
  participants?: Participant[];
}

// Audio track info for debugging
interface AudioTrackInfo {
  enabled: boolean;
  readyState: string;
  id: string;
  kind: string;
  muted: boolean;
  settings?: MediaTrackSettings;
}

// Manual testing global storage interface
interface ManualOfferData {
  callId?: string;
  offer: RTCSessionDescriptionInit;
  timestamp: number;
}

interface ManualAnswerData {
  callId: string;
  answer: RTCSessionDescriptionInit;
  timestamp: number;
}

interface WebRTCGlobalStorage {
  manualOfferData?: ManualOfferData;
  latestOfferData?: ManualOfferData;
  manualAnswerData?: ManualAnswerData;
  latestAnswerData?: ManualAnswerData;
}

// Augment global type for test storage
declare const global: typeof globalThis & WebRTCGlobalStorage;

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCall: CallData | null = null;
  private isInitiator: boolean = false;
  private audioTrack: MediaStreamTrack | null = null;
  private videoTrack: MediaStreamTrack | null = null;
  private signalingState: string = 'stable';
  private queuedIceCandidates: RTCIceCandidateInit[] = [];
  private eventListeners: { [event: string]: ((...args: unknown[]) => void)[] } = {};
  private socketListenersSetup: boolean = false;
  private storedOffer: any = null;

  // Default ICE servers configuration
  private readonly defaultConfig: WebRTCConfig = {
    iceServers: [
      {
        "url": "stun:global.stun.twilio.com:3478",
        "urls": "stun:global.stun.twilio.com:3478"
      },
      {
        "credential": "tinU6VTq1bnhUq1LpEkGAZDp6nz3kUlqi1d73A2y5vE=",
        "url": "turn:global.turn.twilio.com:3478?transport=udp",
        "urls": "turn:global.turn.twilio.com:3478?transport=udp",
        "username": "16be2fcc5acabf18de0fa95400f3fa6c45ca97ec856c5549a6cead2c839870ff"
      },
      {
        "credential": "tinU6VTq1bnhUq1LpEkGAZDp6nz3kUlqi1d73A2y5vE=",
        "url": "turn:global.turn.twilio.com:3478?transport=tcp",
        "urls": "turn:global.turn.twilio.com:3478?transport=tcp",
        "username": "16be2fcc5acabf18de0fa95400f3fa6c45ca97ec856c5549a6cead2c839870ff"
      },
      {
        "credential": "tinU6VTq1bnhUq1LpEkGAZDp6nz3kUlqi1d73A2y5vE=",
        "url": "turn:global.turn.twilio.com:443?transport=tcp",
        "urls": "turn:global.turn.twilio.com:443?transport=tcp",
        "username": "16be2fcc5acabf18de0fa95400f3fa6c45ca97ec856c5549a6cead2c839870ff"
      }
    ],
    iceCandidatePoolSize: 20,
  };




  /**
   * Ensure socket listeners are set up
   */
  private ensureSocketListeners(): void {
    console.log('📞 WebRTC: ensureSocketListeners called, setup status:', this.socketListenersSetup);

    // Check if socket is available and connected
    const socket = socketService.getSocket();
    if (!socket) {
      console.warn('📞 WebRTC: Socket not available, retrying in 1 second...');
      setTimeout(() => this.ensureSocketListeners(), 1000);
      return;
    }

    if (!socket.connected) {
      console.warn('📞 WebRTC: Socket not connected, retrying in 1 second...');
      setTimeout(() => this.ensureSocketListeners(), 1000);
      return;
    }

    // Check if listeners are already set up
    if (this.socketListenersSetup) {
      console.log('📞 WebRTC: Socket listeners already set up, skipping');
      return;
    }

    console.log('📞 WebRTC: Setting up socket listeners for the first time');
    this.setupSocketListeners();
    this.socketListenersSetup = true;

    // Listen for reconnection to re-verify our call state
    socketService.on('reconnect', async () => {
      console.log('📞 WebRTC: Socket reconnected! Checking if call is still active...');
      if (this.currentCall && this.currentCall.callId) {
        try {
          // You might want to re-verify the call with the backend here
          // For now, we at least log it
          console.log('📞 WebRTC: Call was active during reconnection:', this.currentCall.callId);
          // Trigger ICE restart if we were in a call to be safe
          if (this.peerConnection) {
            this.handleConnectionFailure();
          }
        } catch (error) {
          console.error('📞 WebRTC: Error during reconnection call check:', error);
        }
      }
    });

    console.log('📞 WebRTC: Socket listeners setup completed');
  }

  /**
   * Setup socket event listeners for call events
   */
  private setupSocketListeners(): void {
    console.log('📞 WebRTC: Setting up socket listeners');
    console.log('📞 WebRTC: Socket service available:', !!socketService);
    console.log('📞 WebRTC: Socket available:', !!socketService.getSocket());
    console.log('📞 WebRTC: Socket connected:', socketService.getSocket()?.connected);

    // Listen for incoming calls
    const socket = socketService.getSocket();
    if (socket) {
      console.log('📞 WebRTC: Registering call_incoming listener...');
      socket.on('call_incoming', (data: IncomingCallEventData) => {
        console.log('📞 WebRTC: 🔥 LISTENER TRIGGERED! Received call_incoming event:', data);
        console.log('📞 WebRTC: Socket connected:', socketService.getSocket()?.connected);
        console.log('📞 WebRTC: About to call handleCallIncoming with data:', JSON.stringify(data, null, 2));
        try {
          this.handleCallIncoming(data);
          console.log('📞 WebRTC: ✅ handleCallIncoming completed successfully');
        } catch (error) {
          console.error('📞 WebRTC: ❌ Error in handleCallIncoming:', error);
        }
      });
      console.log('📞 WebRTC: call_incoming listener registered successfully');
    } else {
      console.error('📞 WebRTC: No socket available to register listeners');
    }

    // Listen for call accepted
    socketService.getSocket()?.on('call_accepted', (data: CallSessionEventData) => {
      console.log('📞 WebRTC: 🔥 Received call_accepted event:', data);
      this.handleCallAccepted(data);
    });

    // Listen for call declined
    socketService.getSocket()?.on('call_declined', (data: CallSessionEventData) => {
      console.log('📞 WebRTC: 🔥 Received call_declined event:', data);
      this.handleCallDeclined(data);
    });

    // Listen for call ended
    socketService.getSocket()?.on('call_ended', (data: CallSessionEventData) => {
      console.log('📞 WebRTC: 🔥 Received call_ended event:', data);
      this.handleCallEnded(data);
    });

    // Listen for call joined
    socketService.getSocket()?.on('call_joined', (data: CallSessionEventData) => {
      console.log('📞 WebRTC: Received call_joined event:', data);
      this.handleCallJoined(data);
    });

    // Listen for WebRTC signaling
    socketService.getSocket()?.on('webrtc_signaling', (data: SignalingEventData) => {
      console.log('📞 WebRTC: 🔥 LISTENER TRIGGERED! Received webrtc_signaling event:', data);
      console.log('📞 WebRTC: Socket connected:', socketService.getSocket()?.connected);
      console.log('📞 WebRTC: About to call handleSignaling with data:', JSON.stringify(data, null, 2));
      console.log('📞 WebRTC: Current call state before handleSignaling:', {
        hasCall: !!this.currentCall,
        callId: this.currentCall?.callId,
        isInitiator: this.isInitiator,
        hasPeerConnection: !!this.peerConnection,
        signalingState: this.signalingState
      });
      try {
        console.log('📞 WebRTC: Calling handleSignaling now...');
        this.handleSignaling(data);
        console.log('📞 WebRTC: ✅ handleSignaling completed successfully');
      } catch (error) {
        console.error('📞 WebRTC: ❌ Error in handleSignaling:', error);
        if (error instanceof Error) {
          console.error('📞 WebRTC: ❌ Error stack:', error.stack);
        }
      }
    });
  }

  /**
   * Handle incoming call event
   */
  private handleCallIncoming(data: IncomingCallEventData): void {
    console.log('📞 WebRTC: 🔥 handleCallIncoming called with data:', data);
    console.log('📞 WebRTC: Current call before setting:', this.currentCall);

    // Get current user ID from auth store
    let currentUserId: string | null = null;
    try {
      const { useAuthStore } = require('../store/authStore');
      const { userId } = useAuthStore.getState();
      currentUserId = userId;
      console.log('📞 WebRTC: Current user ID from auth store:', currentUserId);
    } catch (error) {
      console.error('📞 WebRTC: Failed to get current user ID from auth store:', error);
    }

    // Set current call data
    this.currentCall = {
      callId: data.callSessionId.toString(),
      callerId: data.callerId.toString(),
      receiverId: currentUserId || data.receiverId?.toString() || data.conversationId.toString(), // Use current user ID, then receiverId, then conversationId as fallback
      conversationId: data.conversationId?.toString(), // Store conversationId separately
      type: data.callType,
      status: 'ringing',
      timestamp: Date.now(),
    };

    console.log('📞 WebRTC: Current call after setting:', this.currentCall);
    this.isInitiator = false;

    // Show incoming call notification and start ringing
    callNotificationService.showIncomingCallNotification(this.currentCall);

    // Emit event to call store
    console.log('📞 WebRTC: Emitting call_invitation event...');
    this.emitCallEvent('call_invitation', this.currentCall);

    // Also trigger the call store's handleIncomingCall method
    try {
      console.log('📞 WebRTC: Getting call store...');
      const { useCallStore } = require('../store/callStore');
      const { handleIncomingCall } = useCallStore.getState();
      console.log('📞 WebRTC: Call store obtained, calling handleIncomingCall with:', this.currentCall);
      handleIncomingCall(this.currentCall);
      console.log('✅ WebRTC: handleIncomingCall called successfully');
    } catch (error) {
      console.error('❌ WebRTC: Failed to trigger call store handleIncomingCall:', error);
      if (error instanceof Error) {
        console.error('❌ WebRTC: Error details:', error.message, error.stack);
      }
    }
  }

  /**
   * Handle call accepted event
   */
  private handleCallAccepted(data: CallSessionEventData): void {
    console.log('📞 WebRTC: Processing call accepted:', data);

    if (this.currentCall && this.currentCall.callId === data.callSessionId.toString()) {
      this.currentCall.status = 'answered';
      this.emitCallEvent('call_answer', this.currentCall);
    }
  }

  /**
   * Handle call declined event
   */
  private handleCallDeclined(data: CallSessionEventData): void {
    console.log('📞 WebRTC: Processing call declined:', data);

    if (this.currentCall && this.currentCall.callId === data.callSessionId.toString()) {
      this.currentCall.status = 'rejected';

      // Stop ringing and show notification
      callNotificationService.stopRinging();
      callNotificationService.showCallDeclinedNotification();

      this.emitCallEvent('call_reject', this.currentCall);
    }
  }

  /**
   * Handle call ended event
   */
  private handleCallEnded(data: CallSessionEventData): void {
    console.log('📞 WebRTC: Processing call ended:', data);

    if (this.currentCall && this.currentCall.callId === data.callSessionId.toString()) {
      this.currentCall.status = 'ended';

      // Stop ringing and show notification
      callNotificationService.stopRinging();
      callNotificationService.showCallEndedNotification();

      this.emitCallEvent('call_end', this.currentCall);

      // Cleanup WebRTC resources
      this.cleanup();

      // Reset call store state
      try {
        const { useCallStore } = require('../store/callStore');
        const { resetCallState } = useCallStore.getState();
        console.log('📞 WebRTC: Resetting call store state due to call ended...');
        resetCallState();
        console.log('✅ WebRTC: Call store state reset successfully');
      } catch (error) {
        console.error('❌ WebRTC: Failed to reset call store state:', error);
      }
    }
  }

  /**
   * Handle call joined event
   */
  private handleCallJoined(data: CallSessionEventData): void {
    console.log('📞 WebRTC: Processing call joined:', data);
    this.emitCallEvent('call_joined', data);
  }

  /**
   * Handle WebRTC signaling event
   */
  private handleSignaling(data: SignalingEventData): void {
    console.log('📞 WebRTC: Processing signaling data:', data);
    console.log('📞 WebRTC: Signaling data type:', data.type);
    console.log('📞 WebRTC: Signaling data content:', JSON.stringify(data.data, null, 2));
    console.log('📞 WebRTC: Current call state:', {
      hasCall: !!this.currentCall,
      callId: this.currentCall?.callId,
      isInitiator: this.isInitiator,
      hasPeerConnection: !!this.peerConnection,
      signalingState: this.signalingState
    });

    // Add a test to see if this method is being called at all
    console.log('📞 WebRTC: handleSignaling method called - this means socket events are working!');

    if (data.type === 'offer') {
      console.log('📞 WebRTC: Handling offer...');
      this.handleOffer(data.data as RTCSessionDescriptionInit);
    } else if (data.type === 'answer') {
      console.log('📞 WebRTC: Handling answer...');
      console.log('📞 WebRTC: Answer received by:', this.isInitiator ? 'CALLER' : 'RECEIVER');
      this.handleAnswer(data.data as RTCSessionDescriptionInit);
    } else if (data.type === 'ice-candidate') {
      console.log('📞 WebRTC: Handling ICE candidate...');
      if (this.peerConnection && this.peerConnection.remoteDescription) {
        this.handleIceCandidate(data.data as RTCIceCandidateInit);
      } else {
        // Queue candidates until SDP (Offer/Answer) is set
        this.queueIceCandidate(data.data as RTCIceCandidateInit);
      }
    } else {
      console.log('📞 WebRTC: Unknown signaling type:', data.type);
    }
  }



  /**
   * Initializes the WebRTC service.
   * This should be called once when the app starts.
   */
  public init(): void {
    if (!webrtcAvailable) {
      console.warn('📞 WebRTC: Native modules not available, service not initialized.');
      return;
    }
    console.log('📞 WebRTC: Service initialized.');

    // Ensure socket listeners are set up
    console.log('📞 WebRTC: Setting up socket listeners during init...');
    this.ensureSocketListeners();

    // Test socket connection
    console.log('📞 WebRTC: Testing socket connection during init...');
    this.testSocketConnection();

    console.log('📞 WebRTC: Init completed successfully');
  }

  /**
   * Test socket connection and event handling
   */
  public testSocketConnection(): void {
    console.log('📞 WebRTC: Testing socket connection...');
    const socket = socketService.getSocket();
    console.log('📞 WebRTC: Socket available:', !!socket);
    console.log('📞 WebRTC: Socket connected:', socket?.connected);
    console.log('📞 WebRTC: Socket ID:', socket?.id);
    console.log('📞 WebRTC: Socket listeners setup status:', this.socketListenersSetup);

    if (socket) {
      console.log('📞 WebRTC: Socket type:', typeof socket);
      console.log('📞 WebRTC: Socket constructor:', socket.constructor.name);
    }
  }

  /**
   * Test incoming call handling (for debugging)
   */
  public testIncomingCall(): void {
    console.log('📞 WebRTC: Testing incoming call...');
    const testCallData: IncomingCallEventData = {
      callSessionId: 'test_call_123',
      callerId: 'test_caller',
      conversationId: 'test_conversation',
      callType: 'audio' as const,
      isGroupCall: true
    };

    console.log('📞 WebRTC: Simulating incoming call with data:', testCallData);
    this.handleCallIncoming(testCallData);
  }

  /**
   * Test with real data structure from logs
   */
  public testRealIncomingCall(): void {
    console.log('📞 WebRTC: Testing with real data structure...');
    const realCallData: IncomingCallEventData = {
      callSessionId: 46,
      conversationId: 68,
      callerId: 21,
      callType: 'audio' as const,
      isGroupCall: true
    };

    console.log('📞 WebRTC: Simulating real incoming call with data:', realCallData);
    this.handleCallIncoming(realCallData);
  }

  /**
   * Test socket event simulation (simulates real backend event)
   */
  public testSocketEventSimulation(): void {
    console.log('📞 WebRTC: Testing socket event simulation...');
    const socket = socketService.getSocket();
    if (socket) {
      console.log('📞 WebRTC: Simulating call_incoming event via socket...');
      const testData: IncomingCallEventData = {
        callSessionId: 47,
        conversationId: 68,
        callerId: 21,
        callType: 'audio' as const,
        isGroupCall: true
      };

      console.log('📞 WebRTC: Socket type:', typeof socket);
      console.log('📞 WebRTC: Socket constructor:', socket.constructor.name);

      // Simulate the event by calling the listener directly
      socket.emit('call_incoming', testData);
      console.log('📞 WebRTC: Socket event emitted');

      // Also try to trigger the listener manually
      console.log('📞 WebRTC: Manually triggering handleCallIncoming...');
      this.handleCallIncoming(testData);
    } else {
      console.error('📞 WebRTC: No socket available for event simulation');
    }
  }

  /**
   * Force re-setup socket listeners
   */
  public forceSetupSocketListeners(): void {
    console.log('📞 WebRTC: Force setting up socket listeners...');
    this.socketListenersSetup = false;
    this.ensureSocketListeners();
    console.log('📞 WebRTC: Socket listeners force setup completed');
  }

  /**
   * End current call and cleanup
   */
  public endCurrentCall(): void {
    console.log('📞 WebRTC: Ending current call...');

    if (this.currentCall) {
      console.log('📞 WebRTC: Current call found:', this.currentCall.callId);

      // End call via backend API if we have a call session ID
      if (this.currentCall.callId) {
        this.endCall(this.currentCall.callId).catch(error => {
          console.error('❌ WebRTC: Failed to end call via backend:', error);
          // Still cleanup locally even if backend call fails
          this.cleanup();
          this.resetCallStoreState();
        });
      } else {
        // Just cleanup locally if no call session ID
        this.cleanup();
        this.resetCallStoreState();
      }
    } else {
      console.log('📞 WebRTC: No current call to end, just cleaning up...');
      this.cleanup();
      this.resetCallStoreState();
    }
  }

  /**
   * Reset call store state
   */
  private resetCallStoreState(): void {
    try {
      const { useCallStore } = require('../store/callStore');
      const { resetCallState } = useCallStore.getState();
      console.log('📞 WebRTC: Resetting call store state...');
      resetCallState();
      console.log('✅ WebRTC: Call store state reset successfully');
    } catch (error) {
      console.error('❌ WebRTC: Failed to reset call store state:', error);
    }
  }

  /**
   * Test call ended event simulation
   */
  public testCallEndedEvent(): void {
    console.log('📞 WebRTC: Testing call ended event simulation...');
    const testData = {
      callSessionId: 47,
      conversationId: 68,
      endedByUserId: 21,
      isGroupCall: true,
      duration: 30,
      timestamp: new Date().toISOString()
    };

    console.log('📞 WebRTC: Simulating call_ended event with data:', testData);
    this.handleCallEnded(testData);
  }

  /**
   * Test call declined event simulation
   */
  public testCallDeclinedEvent(): void {
    console.log('📞 WebRTC: Testing call declined event simulation...');
    const testData = {
      callSessionId: 47,
      conversationId: 68,
      declinedByUserId: 21,
      isGroupCall: true,
      reason: "User is busy",
      timestamp: new Date().toISOString()
    };

    console.log('📞 WebRTC: Simulating call_declined event with data:', testData);
    this.handleCallDeclined(testData);
  }


  /**
   * Answer an incoming call
   */
  async answerCall(callId: string, type: 'audio' | 'video' = 'video'): Promise<void> {
    try {
      console.log('📞 WebRTC: Answering call:', callId);

      if (!this.currentCall || this.currentCall.callId !== callId) {
        throw new Error('Invalid call ID');
      }

      this.isInitiator = false;

      // Get user media
      await this.getUserMedia(type);

      // Create peer connection
      await this.createPeerConnection();

      if (this.storedOffer && this.peerConnection) {
        console.log('📞 WebRTC: Applying stored offer before creating answer.');

        // RTCSessionDescription should be available globally/in scope like RTCPeerConnection
        const RTCSessionDescription = require('react-native-webrtc').RTCSessionDescription;

        const remoteDescription = new RTCSessionDescription(this.storedOffer);
        await this.peerConnection.setRemoteDescription(remoteDescription);
        this.storedOffer = null; // Clear the stored offer once applied
        console.log('📞 WebRTC: ✅ Stored offer applied successfully.');
        await this.createAnswer();

        // Process any ICE candidates that arrived before the SDP
      }
      this.processQueuedIceCandidates();
      // Send answer
      this.sendCallAnswer();

    } catch (error) {
      console.error('❌ WebRTC: Failed to answer call:', error);
      this.cleanup();
      throw error;
    }
  }


  /**
   * Reject an incoming call
   */
  rejectCall(callId: string): void {
    try {
      console.log('📞 WebRTC: Rejecting call:', callId);

      this.sendCallReject();
      this.cleanup();
    } catch (error) {
      console.error('❌ WebRTC: Failed to reject call:', error);
    }
  }

  /**
   * Configure audio session for proper call audio routing
   * This ensures audio goes to speaker/earpiece and not to the device speaker
   */
  private configureAudioSession(): void {
    try {
      console.log('📞 WebRTC: Configuring audio session...');

      if (inCallManagerAvailable && InCallManager) {
        // Ensure InCallManager is properly initialized
        if (typeof InCallManager.setKeepScreenOn === 'function') {
          InCallManager.setKeepScreenOn(true);
          console.log('📞 WebRTC: ✅ Keep screen on enabled');
        }

        // Enable proximity sensor (turns screen off near ear)
        if ('startProximitySensor' in InCallManager && typeof InCallManager.startProximitySensor === 'function') {
          InCallManager.startProximitySensor();
          console.log('📞 WebRTC: ✅ Proximity sensor enabled');
        }

        console.log('📞 WebRTC: ✅ Audio session configured');
      } else {
        console.warn('📞 WebRTC: InCallManager not available for audio session configuration');
      }
    } catch (error) {
      console.error('📞 WebRTC: Failed to configure audio session:', error);
    }
  }

  /**
   * Safe helper to get stream URL in React Native WebRTC environments
   */
  private getStreamUrl(stream: MediaStream | null): string | undefined {
    if (!stream) return undefined;
    return typeof stream.toURL === 'function' ? stream.toURL() : undefined;
  }

  /**
   * Get user media (camera and microphone)
   */
  private async getUserMedia(type: 'audio' | 'video'): Promise<void> {
    try {
      console.log('📞 WebRTC: Getting user media, type:', type);

      // Start InCallManager for proper audio routing
      if (inCallManagerAvailable && InCallManager && typeof InCallManager.start === 'function') {
        console.log('📞 WebRTC: Starting InCallManager...');
        try {
          InCallManager.start({
            media: type,
            auto: true,
            ringback: '',
          });
          console.log('📞 WebRTC: ✅ InCallManager started');

          // Ensure audio session configured
          this.configureAudioSession();

          // Set audio routing based on call type
          if (typeof InCallManager.setSpeakerphoneOn === 'function') {
            const useSpeaker = type === 'video';
            InCallManager.setSpeakerphoneOn(useSpeaker);
            console.log('📞 WebRTC: ✅ Audio routing set:', useSpeaker ? 'speaker' : 'earpiece');
          }

          // Stronger routing on Android if available
          if ('setForceSpeakerphoneOn' in InCallManager && typeof InCallManager.setForceSpeakerphoneOn === 'function') {
            const useSpeaker = type === 'video';
            try {
              InCallManager.setForceSpeakerphoneOn(useSpeaker);
              console.log('📞 WebRTC: ✅ Force speakerphone routing applied:', useSpeaker);
            } catch (e) {
              console.warn('📞 WebRTC: setForceSpeakerphoneOn failed:', e);
            }
          }
        } catch (error) {
          console.error('📞 WebRTC: Failed to start InCallManager:', error);
          console.log('📞 WebRTC: Using fallback audio routing...');
          this.fallbackAudioRouting(false); // Start with earpiece
        }
      } else {
        console.log('📞 WebRTC: InCallManager not available - using fallback audio routing');
        this.fallbackAudioRouting(false); // Start with earpiece
      }

      const constraints = {
        audio: true,
        video: type === 'video' ? {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 15, ideal: 30, max: 30 },
        } : false,
      };

      this.localStream = await mediaDevices.getUserMedia(constraints);
      console.log('📞 WebRTC: Got local stream:', this.localStream);
      console.log('📞 WebRTC: Stream active:', this.localStream.active);
      console.log('📞 WebRTC: Stream ID:', this.localStream.id);
      console.log('📞 WebRTC: ✅ Local stream stored in this.localStream:', !!this.localStream);

      // Store audio and video tracks for control
      const tracks = this.localStream.getTracks();
      console.log('📞 WebRTC: Total tracks:', tracks.length);

      this.audioTrack = tracks.find(track => track.kind === 'audio') || null;
      this.videoTrack = tracks.find(track => track.kind === 'video') || null;

      console.log('📞 WebRTC: Audio track:', this.audioTrack);
      console.log('📞 WebRTC: Audio track enabled:', this.audioTrack?.enabled);
      console.log('📞 WebRTC: Audio track readyState:', this.audioTrack?.readyState);
      console.log('📞 WebRTC: Video track:', this.videoTrack);
      console.log('📞 WebRTC: Video track enabled:', this.videoTrack?.enabled);

      // Ensure audio track is enabled and active
      if (this.audioTrack) {
        this.audioTrack.enabled = true;
        console.log('📞 WebRTC: ✅ Audio track enabled');

        // Force the track to be active and connected to audio session
        if (this.audioTrack.readyState === 'live') {
          console.log('📞 WebRTC: ✅ Audio track is live and active');

          // Audio track is live and active - no need for web AudioContext in React Native
          console.log('📞 WebRTC: ✅ Audio track is live and active - ready for WebRTC');
        } else {
          console.warn('📞 WebRTC: ⚠️ Audio track is not live, state:', this.audioTrack.readyState);
        }
      } else {
        console.error('📞 WebRTC: ❌ No audio track found!');
      }
    } catch (error) {
      console.error('❌ WebRTC: Failed to get user media:', error);
      throw error;
    }
  }

  /**
   * Create peer connection
   */
  private async createPeerConnection(): Promise<void> {
    try {
      console.log('📞 WebRTC: Creating peer connection');

      this.peerConnection = new RTCPeerConnection({
        bundlePolicy: 'balanced',
        iceCandidatePoolSize: 20,
        iceTransportPolicy: 'all',
        rtcpMuxPolicy: 'require',
        iceServers: [
          {
            urls: 'stun:global.stun.twilio.com:3478'
          },
          {
            credential: 'lNFLGO2PHcmQ+f4wRkROKHiPsmzq2bQfZMXTtrzBMUE=',
            urls: 'turn:global.turn.twilio.com:3478?transport=udp',
            username: 'c3a45bf66b96aed3aa2c2efc5bd8aa50b138151b101f3f06b6024a02ce3c5ddc'
          },
          {
            credential: 'lNFLGO2PHcmQ+f4wRkROKHiPsmzq2bQfZMXTtrzBMUE=',
            urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
            username: 'c3a45bf66b96aed3aa2c2efc5bd8aa50b138151b101f3f06b6024a02ce3c5ddc'
          },
          {
            credential: 'lNFLGO2PHcmQ+f4wRkROKHiPsmzq2bQfZMXTtrzBMUE=',
            urls: 'turn:global.turn.twilio.com:443?transport=tcp',
            username: 'c3a45bf66b96aed3aa2c2efc5bd8aa50b138151b101f3f06b6024a02ce3c5ddc'
          }
        ]
      });

      // Add local stream to peer connection
      if (this.localStream) {
        const tracks = this.localStream.getTracks();
        console.log('📞 WebRTC: Adding', tracks.length, 'tracks to peer connection');

        tracks.forEach((track, index) => {
          console.log(`📞 WebRTC: Adding track ${index}:`, {
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            id: track.id
          });
          if (this.peerConnection && this.localStream) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        });

        console.log('📞 WebRTC: ✅ All tracks added to peer connection');
      } else {
        console.log('📞 WebRTC: ❌ No local stream to add to peer connection');
      }

      // Handle ICE candidates
      this.peerConnection.addEventListener('icecandidate', (event: RTCIceCandidateEvent<'icecandidate'>) => {
        if (event.candidate) {
          console.log('📞 WebRTC: Sending ICE candidate');
          this.sendIceCandidate(event.candidate);
        }
      });

      // Handle remote stream
      this.peerConnection.addEventListener('track', (event: RTCTrackEvent<'track'>) => {
        console.log('📞 WebRTC: Received remote track:', {
          kind: event.track.kind,
          id: event.track.id,
          enabled: event.track.enabled,
          muted: event.track.muted,
          readyState: event.track.readyState
        });

        this.remoteStream = event.streams[0];
        console.log('📞 WebRTC: Remote stream set:', {
          id: this.remoteStream?.id,
          active: this.remoteStream?.active,
          trackCount: this.remoteStream?.getTracks().length
        });
        console.log('📞 WebRTC: ✅ Remote stream stored in this.remoteStream:', !!this.remoteStream);

        // Enable all audio tracks in the remote stream
        if (this.remoteStream) {
          const audioTracks = this.remoteStream.getAudioTracks();
          console.log('📞 WebRTC: Remote audio tracks:', audioTracks.length);

          audioTracks.forEach((track, index) => {
            // CRITICAL: Must enable audio tracks for audio playback
            track.enabled = true;
            console.log(`📞 WebRTC: Enabled remote audio track ${index}:`, {
              id: track.id,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState
            });
          });

          // Ensure audio session is configured for call audio routing
          this.configureAudioSession();

          // Audio routing is maintained through InCallManager
          console.log('📞 WebRTC: Audio routing maintained');
        }

        // Emit event for UI update - UI MUST use RTCView component to render this stream
        console.log('📞 WebRTC: Emitting remoteStream event - UI must use RTCView component to render');
        this.emitCallEvent('remoteStream', { remoteStream: this.remoteStream });
      });

      // Handle connection state changes
      this.peerConnection.addEventListener('connectionstatechange', () => {
        console.log('📞 WebRTC: Connection state:', this.peerConnection?.connectionState);
        if (this.peerConnection?.connectionState === 'connected') {
          console.log('📞 WebRTC: ✅ Peer connection established!');
          // Check if we have remote stream after connection
          setTimeout(() => {
            console.log('📞 WebRTC: Post-connection remote stream check:', {
              hasRemoteStream: !!this.remoteStream,
              remoteStreamActive: this.remoteStream?.active,
              remoteStreamId: this.remoteStream?.id
            });
          }, 1000);
        } else if (this.peerConnection?.connectionState === 'failed') {
          console.log('📞 WebRTC: ❌ Peer connection failed! Attempting ICE restart...');
          this.handleConnectionFailure();
        } else if (this.peerConnection?.connectionState === 'disconnected') {
          console.log('📞 WebRTC: ⚠️ Peer connection disconnected. Waiting for recovery...');
        }
      });

      // Handle signaling state changes
      this.peerConnection.addEventListener('signalingstatechange', () => {
        this.signalingState = this.peerConnection?.signalingState || 'stable';
        console.log('📞 WebRTC: Signaling state changed to:', this.signalingState);
      });

      // Handle ICE connection state changes
      this.peerConnection.addEventListener('iceconnectionstatechange', () => {
        console.log('📞 WebRTC: ICE connection state:', this.peerConnection?.iceConnectionState);
      });

      // Handle ICE gathering state changes
      this.peerConnection.addEventListener('icegatheringstatechange', () => {
        console.log('📞 WebRTC: ICE gathering state:', this.peerConnection?.iceGatheringState);
      });

    } catch (error) {
      console.error('❌ WebRTC: Failed to create peer connection:', error);
      throw error;
    }
  }

  /**
   * Handle peer connection failure by attempting an ICE restart
   */
  private async handleConnectionFailure(): Promise<void> {
    try {
      if (!this.peerConnection) return;

      console.log('📞 WebRTC: Initiating ICE restart...');
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);

      this.sendOffer(offer);
      console.log('📞 WebRTC: ✅ ICE restart offer sent');
    } catch (error) {
      console.error('📞 WebRTC: ❌ Failed to perform ICE restart:', error);
      // If restart fails, we might need to end the call
      this.emitCallEvent('error', { error: 'Connection failed and could not be recovered' });
    }
  }

  /**
   * Create and send offer
   */
  private async createOffer(): Promise<void> {
    try {
      if (!this.peerConnection) return;

      console.log('📞 WebRTC: Creating offer');
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.sendOffer(offer);
    } catch (error) {
      console.error('❌ WebRTC: Failed to create offer:', error);
    }
  }

  /**
   * Create and send answer
   */
  private async createAnswer(): Promise<void> {
    try {
      if (!this.peerConnection) return;

      console.log('📞 WebRTC: Creating answer');
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.sendAnswer(answer);
    } catch (error) {
      console.error('❌ WebRTC: Failed to create answer:', error);
    }
  }


  /**
   * Socket event handlers
   */
  private handleCallInvitation(data: { callId: string; callerId: string; receiverId: string; type: 'audio' | 'video' }): void {
    console.log('📞 WebRTC: Processing incoming call invitation:', data);

    // Set the current call data for incoming call
    this.currentCall = {
      callId: data.callId,
      callerId: data.callerId,
      receiverId: data.receiverId,
      type: data.type,
      status: 'ringing',
      timestamp: Date.now(),
    };

    this.isInitiator = false;

    // Emit event for UI to handle
    this.emitCallEvent('call_invitation', data);
  }

  private handleCallAnswer(data: CallSessionEventData): void {
    if (this.isInitiator) {
      this.createOffer();
    }
    this.emitCallEvent('call_answer', data);
  }

  private handleCallRejection(data: CallSessionEventData): void {
    this.cleanup();
    this.emitCallEvent('call_reject', data);
  }

  private handleCallEnd(data: CallSessionEventData): void {
    this.cleanup();
    this.emitCallEvent('call_end', data);
  }



  // private async handleOffer(data: RTCSessionDescriptionInit): Promise<void> {
  //   try {
  //     // Check if call has been accepted before processing offer
  //     if (!this.currentCall || this.currentCall.status !== 'answered') {
  //       console.log('📞 WebRTC: Cannot process offer - call not accepted yet. Current status:', this.currentCall?.status);
  //       console.log('📞 WebRTC: Storing offer for later processing...');
  //       // Store the offer for later processing when call is accepted
  //       this.storedOffer = data;
  //       return;
  //     }

  //     if (!this.peerConnection) {
  //       console.log('📞 WebRTC: No peer connection, creating one for offer');
  //       await this.createPeerConnection();
  //     }

  //     // Check signaling state - only accept offer if we're in stable state
  //     if (this.signalingState !== 'stable') {
  //       console.log('📞 WebRTC: Cannot handle offer, signaling state is:', this.signalingState);
  //       return;
  //     }

  //     // Check if we already have a remote description
  //     if (this.peerConnection.remoteDescription) {
  //       console.log('📞 WebRTC: Remote description already set, ignoring duplicate offer');
  //       return;
  //     }

  //     // Join call session before processing offer (needed for signaling authorization)
  //     if (this.currentCall && this.currentCall.callId) {
  //       console.log('📞 WebRTC: Joining call session before processing offer...');
  //       try {
  //         await this.joinGroupCall(this.currentCall.callId);
  //         console.log('📞 WebRTC: Successfully joined call session for offer processing');
  //       } catch (joinError) {
  //         // If join fails with "This is not a group call", that's expected for direct calls
  //         if (joinError instanceof Error && joinError.message.includes('This is not a group call')) {
  //           console.log('📞 WebRTC: Direct call detected - join not required for offer processing');
  //         } else {
  //           console.error('❌ WebRTC: Failed to join call session for offer processing:', joinError);
  //           // Don't continue if join fails for other reasons
  //           const errorMessage = joinError instanceof Error ? joinError.message : 'Unknown error';
  //           throw new Error(`Failed to join call session: ${errorMessage}`);
  //         }
  //       }
  //     }

  //     console.log('📞 WebRTC: Setting remote description for offer');
  //     console.log('📞 WebRTC: Offer data structure:', JSON.stringify(data, null, 2));

  //     // Handle both data.offer and direct data structure
  //     const offerData = data.offer || data;
  //     console.log('📞 WebRTC: Using offer data:', JSON.stringify(offerData, null, 2));

  //     await this.peerConnection.setRemoteDescription(offerData);
  //     console.log('📞 WebRTC: Creating answer for offer');
  //     await this.createAnswer();

  //     // Process any queued ICE candidates
  //     await this.processQueuedIceCandidates();
  //   } catch (error) {
  //     console.error('❌ WebRTC: Failed to handle offer:', error);
  //   }
  // }

  private async handleOffer(data: RTCSessionDescriptionInit): Promise<void> {
    try {
      // 1. Check if the call has been accepted before processing the offer SDP
      if (!this.currentCall || this.currentCall.status !== 'answered') {
        console.log('📞 WebRTC: Cannot process offer - call not accepted yet. Storing offer.');
        this.storedOffer = data;
        return;
      }

      // 2. Peer Connection Check
      if (!this.peerConnection) {
        console.log('📞 WebRTC: No peer connection, creating one for offer processing.');
        // This should theoretically not happen if `answerCall` ran, but acts as a safeguard
        await this.createPeerConnection();
      }

      // 3. Set Remote Description (Offer)
      const remoteDescription = new RTCSessionDescription(data);

      console.log('📞 WebRTC: Setting remote description (Offer)');
      await this.peerConnection?.setRemoteDescription(remoteDescription);

      // 4. Create and Send Answer
      await this.createAnswer();

      // 5. Process any candidates that arrived while waiting for SDP exchange
      this.processQueuedIceCandidates();

      console.log('📞 WebRTC: ✅ Offer processed and Answer sent.');

    } catch (error) {
      console.error('❌ WebRTC: Failed to handle offer:', error);
      this.cleanup();
    }
  }
  private async handleAnswer(data: RTCSessionDescriptionInit): Promise<void> {
    try {
      console.log('📞 WebRTC: handleAnswer called - setting up remote stream...');
      console.log('📞 WebRTC: Current peer connection state:', {
        hasPeerConnection: !!this.peerConnection,
        connectionState: this.peerConnection?.connectionState,
        signalingState: this.peerConnection?.signalingState,
        iceConnectionState: this.peerConnection?.iceConnectionState
      });

      if (!this.peerConnection) {
        console.log('📞 WebRTC: No peer connection for answer');
        return;
      }

      // Check signaling state - only accept answer if we're in have-local-offer state
      if (this.signalingState !== 'have-local-offer') {
        console.log('📞 WebRTC: Cannot handle answer, signaling state is:', this.signalingState);
        return;
      }

      // Check if we already have a remote description
      if (this.peerConnection.remoteDescription) {
        console.log('📞 WebRTC: Remote description already set, ignoring duplicate answer');
        return;
      }

      console.log('📞 WebRTC: Setting remote description for answer');
      console.log('📞 WebRTC: Answer data structure:', JSON.stringify(data, null, 2));

      // Handle both data.answer and direct data structure
      const answerData = (data as { answer?: RTCSessionDescriptionInit }).answer || data;
      console.log('📞 WebRTC: Using answer data:', JSON.stringify(answerData, null, 2));

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerData));
      console.log('📞 WebRTC: Answer set successfully');

      // Process any queued ICE candidates
      await this.processQueuedIceCandidates();

      console.log('📞 WebRTC: Answer handling completed - remote stream should be available now');
      console.log('📞 WebRTC: Final peer connection state:', {
        connectionState: this.peerConnection.connectionState,
        signalingState: this.peerConnection.signalingState,
        iceConnectionState: this.peerConnection.iceConnectionState,
        hasRemoteStream: !!this.remoteStream
      });
    } catch (error) {
      console.error('❌ WebRTC: Failed to handle answer:', error);
    }
  }

  private async handleIceCandidate(data: RTCIceCandidateInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        console.log('📞 WebRTC: No peer connection for ICE candidate');
        return;
      }

      // Check if remote description is set before adding ICE candidates
      if (!this.peerConnection.remoteDescription) {
        console.log('📞 WebRTC: Remote description not set yet, queuing ICE candidate');
        // Store the candidate to add later when remote description is set
        this.queueIceCandidate((data as { candidate?: RTCIceCandidateInit }).candidate || data);
        return;
      }

      console.log('📞 WebRTC: Adding ICE candidate');
      const candidateData = (data as { candidate?: RTCIceCandidateInit }).candidate || data;

      // Sanitize candidate: react-native-webrtc requires at least one of sdpMid or sdpMLineIndex
      if (candidateData && (candidateData.sdpMid == null && candidateData.sdpMLineIndex == null)) {
        console.warn('📞 WebRTC: ICE candidate missing sdpMid/sdpMLineIndex, applying fallback sdpMLineIndex=0');
        // Prefer leaving sdpMid undefined and set sdpMLineIndex to 0 as a safe fallback
        (candidateData as RTCIceCandidateInit).sdpMLineIndex = 0;
      }

      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
      console.log('📞 WebRTC: ICE candidate added successfully');
    } catch (error) {
      console.error('❌ WebRTC: Failed to handle ICE candidate:', error);
    }
  }

  /**
   * Determine if a conversation is a group call based on participant count
   */
  private async determineIsGroupCall(conversationId: number, fallbackValue: boolean = false): Promise<boolean> {
    try {
      const conversationResponse = await fetch(`https://api.gofrts.com/api/v1/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (conversationResponse.ok) {
        const conversationData = await conversationResponse.json();
        if (conversationData.data?.participants) {
          const participantCount = conversationData.data.participants.length;
          const isGroupCall = participantCount > 2; // More than 2 participants = group call
          console.log('📞 WebRTC: Participant count:', participantCount, 'isGroupCall:', isGroupCall);
          return isGroupCall;
        }
      }
    } catch (error) {
      console.log('📞 WebRTC: Could not fetch conversation participants:', error);
    }

    console.log('📞 WebRTC: Using fallback isGroupCall value:', fallbackValue);
    return fallbackValue;
  }

  /**
   * Backend API Integration Methods
   */
  async initiateCall(conversationId: number, callType: 'audio' | 'video', isGroupCall?: boolean): Promise<ApiResponse<CallInitiateResponse>> {
    try {
      console.log('📞 WebRTC: Initiating call via backend API:', { conversationId, callType, isGroupCall });

      // Ensure socket listeners are set up
      this.ensureSocketListeners();

      // Test conversation access first
      const hasAccess = await this.testConversationAccess(conversationId);
      if (!hasAccess) {
        throw new Error(`Cannot access conversation ${conversationId}. Please check if the conversation exists and you have permission to access it.`);
      }

      // Check and end any active calls in this conversation
      await this.checkAndEndActiveCalls(conversationId);

      // Determine if this is a group call based on participant count
      const actualIsGroupCall = await this.determineIsGroupCall(conversationId, Boolean(isGroupCall));

      // Try different request body formats based on backend documentation
      const requestBody = {
        conversationId: Number(conversationId), // Ensure it's a number
        callType: callType,
        isGroupCall: actualIsGroupCall, // Dynamic based on participant count
      };

      console.log('📞 WebRTC: Request body:', JSON.stringify(requestBody, null, 2));
      console.log('📞 WebRTC: Auth token:', await this.getAuthToken() ? 'Present' : 'Missing');
      console.log('📞 WebRTC: Conversation ID type:', typeof conversationId);
      console.log('📞 WebRTC: Call type:', callType);
      console.log('📞 WebRTC: Is group call (dynamic):', actualIsGroupCall);
      console.log('📞 WebRTC: Original isGroupCall parameter:', isGroupCall);

      const response = await fetch('https://api.gofrts.com/api/v1/webrtc/calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📞 WebRTC: Response status:', response.status);
      console.log('📞 WebRTC: Response headers:', Object.fromEntries(response.headers.entries()));

      // Log response body even if it's an error
      const responseText = await response.text();
      console.log('📞 WebRTC: Response body:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${responseText}`);
      }

      const result: ApiResponse<CallInitiateResponse> = JSON.parse(responseText);
      console.log('📞 WebRTC: Call initiated successfully:', result);

      // Set current call data
      this.currentCall = {
        callId: result.data.id.toString(),
        callerId: result.data.callerId.toString(),
        receiverId: conversationId.toString(),
        conversationId: conversationId.toString(), // Store conversationId
        type: callType,
        status: 'initiating',
        timestamp: Date.now(),
      };
      this.isInitiator = true;

      // Set up WebRTC connection for the caller
      try {
        console.log('📞 WebRTC: Setting up WebRTC connection for caller...');
        await this.getUserMedia(callType);
        await this.createPeerConnection();

        // Create and send offer as the caller
        console.log('📞 WebRTC: Creating offer as caller...');
        const offer = await this.peerConnection!.createOffer();
        await this.peerConnection!.setLocalDescription(offer);

        // Send offer via backend signaling
        console.log('📞 WebRTC: Sending offer via backend signaling...');
        console.log('📞 WebRTC: Offer data:', JSON.stringify(offer, null, 2));

        // Convert RTCSessionDescription to plain object for backend
        const offerData = {
          type: offer.type,
          sdp: offer.sdp,
        };

        // For group calls, we need to get the actual user IDs of participants
        // Try to get participant IDs from the conversation
        let participantIds: number[] = [];
        try {
          // Get conversation details to find participants
          const conversationResponse = await fetch(`https://api.gofrts.com/api/v1/conversations/${conversationId}`, {
            headers: {
              'Authorization': `Bearer ${await this.getAuthToken()}`,
            },
          });

          if (conversationResponse.ok) {
            const conversationData: ApiResponse<ConversationData> = await conversationResponse.json();
            if (conversationData.data?.participants) {
              participantIds = conversationData.data.participants
                .map((p: Participant) => p.user?.id || p.id)
                .filter((id: number | undefined): id is number => id !== undefined && id !== result.data.callerId);
              console.log('📞 WebRTC: Found participant IDs:', participantIds);
            }
          }
        } catch (error) {
          console.log('📞 WebRTC: Could not fetch conversation participants:', error);
        }

        // Send offer to all participants (if we found them) or without toUserId
        if (participantIds.length > 0) {
          console.log('📞 WebRTC: Sending offer to participants:', participantIds);
          // For now, send to the first participant
          await this.sendSignalingData(result.data.id.toString(), 'offer', offerData, participantIds[0]);
        } else {
          console.log('📞 WebRTC: Sending offer without toUserId (group call)');
          await this.sendSignalingData(result.data.id.toString(), 'offer', offerData);
        }
        console.log('✅ WebRTC: Offer sent successfully');

      } catch (error) {
        console.error('❌ WebRTC: Failed to setup WebRTC connection for caller:', error);
      }

      return result;
    } catch (error) {
      console.error('❌ WebRTC: Failed to initiate call:', error);
      throw error;
    }
  }

  async acceptCall(callSessionId: string): Promise<ApiResponse<CallActionResponse>> {
    try {
      console.log('📞 WebRTC: Accepting call via backend API:', callSessionId);

      const response = await fetch(`https://api.gofrts.com/api/v1/webrtc/calls/${callSessionId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<CallActionResponse> = await response.json();
      console.log('📞 WebRTC: Call accepted successfully:', result);

      if (this.currentCall) {
        this.currentCall.status = 'answered';
      }

      // Update call store state to reflect call is now active
      try {
        const { useCallStore } = require('../store/callStore');
        const { handleCallAnswered } = useCallStore.getState();
        console.log('📞 WebRTC: Updating call store state for accepted call...');
        handleCallAnswered(this.currentCall);
        console.log('✅ WebRTC: Call store state updated for accepted call');
      } catch (error) {
        console.error('❌ WebRTC: Failed to update call store state:', error);
      }

      // Try to join call session - if it fails with "This is not a group call", 
      // that means it's a direct call and we don't need to join
      console.log('📞 WebRTC: Attempting to join call session...');
      console.log('📞 WebRTC: Call session ID for join:', callSessionId);

      try {
        const joinResult = await this.joinGroupCall(callSessionId);
        console.log('📞 WebRTC: Join result:', joinResult);
        console.log('✅ WebRTC: Successfully joined group call session');
      } catch (joinError: unknown) {
        // If join fails with "This is not a group call", that's expected for direct calls
        const errorMessage = joinError instanceof Error ? joinError.message : 'Unknown error';
        if (errorMessage.includes('This is not a group call')) {
          console.log('📞 WebRTC: Direct call detected - join not required');
        } else {
          console.error('❌ WebRTC: Failed to join call session:', joinError);
          console.error('❌ WebRTC: Join error details:', {
            message: errorMessage,
            error: joinError
          });
          // Don't continue if join fails for other reasons
          throw new Error(`Failed to join call session: ${errorMessage}`);
        }
      }

      // Set up WebRTC connection after joining call session
      try {
        console.log('📞 WebRTC: Setting up WebRTC connection for accepted call...');
        await this.getUserMedia('audio');
        await this.createPeerConnection();
        // Ensure audio session and routing for received calls
        this.configureAudioSession();
        if (inCallManagerAvailable && InCallManager && typeof InCallManager.setSpeakerphoneOn === 'function') {
          try {
            InCallManager.setSpeakerphoneOn(false); // default to earpiece for audio calls
          } catch (e) {
            console.warn('📞 WebRTC: Failed to set speakerphone for accepted call:', e);
          }
        }
        console.log('✅ WebRTC: WebRTC connection setup completed for accepted call');

        // Check if we have a stored offer to process
        if (this.storedOffer) {
          console.log('📞 WebRTC: Processing stored offer after call acceptance...');
          await this.handleOffer(this.storedOffer);
          this.storedOffer = null; // Clear the stored offer
        } else {
          console.log('📞 WebRTC: No stored offer found, waiting for offer from caller...');
        }

        console.log('📞 WebRTC: Current signaling state:', this.signalingState);
        console.log('📞 WebRTC: Current connection state:', this.peerConnection?.connectionState);
      } catch (error) {
        console.error('❌ WebRTC: Failed to setup WebRTC connection:', error);
      }

      return result;
    } catch (error) {
      console.error('❌ WebRTC: Failed to accept call:', error);
      throw error;
    }
  }

  async declineCall(callSessionId: string, reason?: string): Promise<ApiResponse<CallActionResponse>> {
    try {
      console.log('📞 WebRTC: Declining call via backend API:', { callSessionId, reason });

      const response = await fetch(`https://api.gofrts.com/api/v1/webrtc/calls/${callSessionId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<CallActionResponse> = await response.json();
      console.log('📞 WebRTC: Call declined successfully:', result);

      // Cleanup WebRTC resources
      this.cleanup();

      // Reset call store state
      this.resetCallStoreState();

      return result;
    } catch (error) {
      console.error('❌ WebRTC: Failed to decline call:', error);
      throw error;
    }
  }

  async endCall(callSessionId: string): Promise<ApiResponse<CallActionResponse>> {
    try {
      console.log('📞 WebRTC: Ending call via backend API:', callSessionId);

      const response = await fetch(`https://api.gofrts.com/api/v1/webrtc/calls/${callSessionId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<CallActionResponse> = await response.json();
      console.log('📞 WebRTC: Call ended successfully:', result);

      // Cleanup WebRTC resources
      this.cleanup();

      // Reset call store state
      try {
        const { useCallStore } = require('../store/callStore');
        const { resetCallState } = useCallStore.getState();
        console.log('📞 WebRTC: Resetting call store state...');
        resetCallState();
        console.log('✅ WebRTC: Call store state reset successfully');
      } catch (error) {
        console.error('❌ WebRTC: Failed to reset call store state:', error);
      }

      return result;
    } catch (error) {
      console.error('❌ WebRTC: Failed to end call:', error);
      throw error;
    }
  }

  async joinGroupCall(callSessionId: string): Promise<ApiResponse<CallActionResponse> | { success: boolean; message: string }> {
    try {
      console.log('📞 WebRTC: Joining group call via backend API:', callSessionId);
      console.log('📞 WebRTC: Join URL:', `https://api.gofrts.com/api/v1/webrtc/calls/${callSessionId}/join`);

      const response = await fetch(`https://api.gofrts.com/api/v1/webrtc/calls/${callSessionId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      console.log('📞 WebRTC: Join response status:', response.status);
      console.log('📞 WebRTC: Join response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();

        // If it's "This is not a group call", that's expected for direct calls
        if (errorText.includes('This is not a group call')) {
          console.log('📞 WebRTC: Direct call detected - join not required');
          console.log('📞 WebRTC: Join response:', errorText);
          return { success: false, message: 'Direct call - join not required' };
        }

        console.error('📞 WebRTC: Join error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result: ApiResponse<CallActionResponse> = await response.json();
      console.log('📞 WebRTC: Joined group call successfully:', result);

      return result;
    } catch (error) {
      console.error('❌ WebRTC: Failed to join group call:', error);
      throw error;
    }
  }

  async sendSignalingData(callSessionId: string, type: string, data: RTCSessionDescriptionInit | RTCIceCandidateInit | { type: string; sdp?: string }, toUserId?: number): Promise<ApiResponse<CallActionResponse>> {
    try {
      console.log('📞 WebRTC: Sending signaling data via backend API:', { callSessionId, type, toUserId });
      console.log('📞 WebRTC: Signaling data payload:', JSON.stringify({ type, data, toUserId }, null, 2));

      // For group calls, ensure we're joined to the call session before sending signaling data
      // For direct calls, joining is not required
      if (this.currentCall && this.currentCall.type) {
        // Check if this is a group call by looking at the call data
        // For now, we'll try to join and handle the error gracefully
        console.log('📞 WebRTC: Checking if call session join is required for signaling...');
        try {
          await this.joinGroupCall(callSessionId);
          console.log('📞 WebRTC: Call session join confirmed');
        } catch (joinError: unknown) {
          // If join fails with "This is not a group call", that's expected for direct calls
          const errorMessage = joinError instanceof Error ? joinError.message : 'Unknown error';
          if (errorMessage.includes('This is not a group call')) {
            console.log('📞 WebRTC: Direct call detected - join not required, continuing with signaling...');
          } else {
            console.log('📞 WebRTC: Join check failed, but continuing with signaling...');
            console.log('📞 WebRTC: Join error details:', errorMessage);
          }
        }
      }

      const authToken = await this.getAuthToken();
      console.log('📞 WebRTC: Auth token for signaling:', authToken);

      const response = await fetch(`https://api.gofrts.com/api/v1/webrtc/calls/${callSessionId}/signaling`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          type,
          data,
          toUserId,
        }),
      });

      console.log('📞 WebRTC: Backend response status:', response);
      console.log('📞 WebRTC: Backend response ok:', response.ok);

      if (!response.ok) {
        // Get the error response body to see what the backend is rejecting
        const errorText = await response.text();
        console.error('📞 WebRTC: Backend error response:', errorText);
        console.error('📞 WebRTC: Request payload that failed:', JSON.stringify({ type, data, toUserId }, null, 2));
        console.error('📞 WebRTC: Call session ID:', callSessionId);

        // If 403 Unauthorized, try to join the call session first
        if (response.status === 403) {
          console.log('📞 WebRTC: 403 Unauthorized - attempting to join call session...');
          console.log('📞 WebRTC: Call session ID for join:', callSessionId);
          try {
            const joinResult = await this.joinGroupCall(callSessionId);
            console.log('📞 WebRTC: Join result:', joinResult);
            console.log('📞 WebRTC: Successfully joined call session, retrying signaling...');

            // Retry the signaling request
            const retryResponse = await fetch(`https://api.gofrts.com/api/v1/webrtc/calls/${callSessionId}/signaling`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await this.getAuthToken()}`,
              },
              body: JSON.stringify({
                type,
                data,
                toUserId,
              }),
            });

            if (retryResponse.ok) {
              const retryResult: ApiResponse<CallActionResponse> = await retryResponse.json();
              console.log('📞 WebRTC: Signaling data sent successfully after joining:', retryResult);
              return retryResult;
            } else {
              const retryErrorText = await retryResponse.text();
              console.error('📞 WebRTC: Retry also failed:', retryErrorText);
            }
          } catch (joinError) {
            console.error('📞 WebRTC: Failed to join call session:', joinError);
          }
        }

        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result: ApiResponse<CallActionResponse> = await response.json();
      console.log('📞 WebRTC: Signaling data sent successfully:', result);

      return result;
    } catch (error) {
      console.error('❌ WebRTC: Failed to send signaling data:', error);
      throw error;
    }
  }

  private async getAuthToken(): Promise<string> {
    try {
      const { AuthToken } = await import('@app/helpers');
      return await AuthToken.get() || '';
    } catch (error) {
      console.error('❌ WebRTC: Failed to get auth token:', error);
      return '';
    }
  }

  /**
   * Test conversation access before initiating call
   */
  async testConversationAccess(conversationId: number): Promise<boolean> {
    try {
      console.log('📞 WebRTC: Testing conversation access for ID:', conversationId);

      // Try to fetch conversation details to verify access
      const response = await fetch(`https://api.gofrts.com/api/v1/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      console.log('📞 WebRTC: Conversation access test status:', response.status);

      if (response.ok) {
        const conversation = await response.json();
        console.log('📞 WebRTC: Conversation details:', conversation);
        return true;
      } else {
        console.warn('⚠️ WebRTC: Cannot access conversation:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ WebRTC: Failed to test conversation access:', error);
      return false;
    }
  }

  /**
   * Check for active calls in conversation and end them
   */
  async checkAndEndActiveCalls(conversationId: number): Promise<void> {
    try {
      console.log('📞 WebRTC: Checking for active calls in conversation:', conversationId);

      // Try to get active calls for this conversation
      const response = await fetch(`https://api.gofrts.com/api/v1/webrtc/calls/active?conversationId=${conversationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📞 WebRTC: Active calls found:', data);

        // End any active calls
        if (data.data && data.data.length > 0) {
          for (const call of data.data) {
            console.log('📞 WebRTC: Ending active call:', call.id);
            try {
              await this.endCall(call.id.toString());
              console.log('✅ WebRTC: Successfully ended call:', call.id);
            } catch (error) {
              console.error('❌ WebRTC: Failed to end call:', call.id, error);
            }
          }
        }
      } else {
        console.log('📞 WebRTC: No active calls endpoint or no active calls found');
      }
    } catch (error) {
      console.error('❌ WebRTC: Failed to check active calls:', error);
      // Don't throw error, just log it and continue
    }
  }

  /**
   * Legacy Socket event emitters (for backward compatibility)
   */
  private sendCallInvitation(): void {
    if (!this.currentCall) return;

    console.log('📞 WebRTC: Sending call invitation to server:', {
      callId: this.currentCall.callId,
      callerId: this.currentCall.callerId,
      receiverId: this.currentCall.receiverId,
      type: this.currentCall.type,
    });

    // Send to server to route to the other user
    socketService.getSocket()?.emit('call_invitation', {
      callId: this.currentCall.callId,
      callerId: this.currentCall.callerId,
      receiverId: this.currentCall.receiverId,
      type: this.currentCall.type,
    });
  }

  private sendCallAnswer(): void {
    if (!this.currentCall) return;

    console.log('📞 WebRTC: Sending call answer to server:', {
      callId: this.currentCall.callId,
    });

    // Send to server to route to the other user
    socketService.getSocket()?.emit('call_answer', {
      callId: this.currentCall.callId,
    });
  }

  private sendCallReject(): void {
    if (!this.currentCall) return;

    console.log('📞 WebRTC: Sending call reject to server:', {
      callId: this.currentCall.callId,
    });

    // Send to server to route to the other user
    socketService.getSocket()?.emit('call_reject', {
      callId: this.currentCall.callId,
    });
  }

  private sendCallEnd(): void {
    if (!this.currentCall) return;

    console.log('📞 WebRTC: Sending call end to server:', {
      callId: this.currentCall.callId,
    });

    // Send to server to route to the other user
    socketService.getSocket()?.emit('call_end', {
      callId: this.currentCall.callId,
    });
  }

  private async sendOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.currentCall) return;

    console.log('📞 WebRTC: Sending offer via backend API:', {
      callId: this.currentCall.callId,
    });

    try {
      // Use backend API for signaling
      await this.sendSignalingData(this.currentCall.callId, 'offer', offer);
      console.log('✅ WebRTC: Offer sent successfully via backend API');
    } catch (error) {
      console.error('❌ WebRTC: Failed to send offer via backend API:', error);
      // Fallback to socket method if backend fails
      socketService.getSocket()?.emit('webrtc_offer', {
        callId: this.currentCall.callId,
        offer,
      });
    }
  }

  private async sendAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.currentCall) return;

    console.log('📞 WebRTC: Sending answer via backend API:', {
      callId: this.currentCall.callId,
    });

    try {
      // Convert RTCSessionDescription to plain object for backend
      const answerData = {
        type: answer.type,
        sdp: answer.sdp,
      };

      console.log('📞 WebRTC: Answer data:', JSON.stringify(answerData, null, 2));

      // Use backend API for signaling
      // For answers, we need to send to the caller
      let receiverId: number | undefined = undefined;

      // If we have callerId, send answer to the caller
      if (this.currentCall.callerId) {
        receiverId = parseInt(this.currentCall.callerId);
      }

      if (receiverId) {
        console.log('📞 WebRTC: Sending answer to caller:', receiverId);
        await this.sendSignalingData(this.currentCall.callId, 'answer', answerData, receiverId);
      } else {
        console.log('📞 WebRTC: Sending answer without toUserId (fallback)');
        await this.sendSignalingData(this.currentCall.callId, 'answer', answerData);
      }
      console.log('✅ WebRTC: Answer sent successfully via backend API');
    } catch (error) {
      console.error('❌ WebRTC: Failed to send answer via backend API:', error);
      // Fallback to socket method if backend fails
      socketService.getSocket()?.emit('webrtc_answer', {
        callId: this.currentCall.callId,
        answer,
      });
    }
  }

  private async sendIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.currentCall) return;

    console.log('📞 WebRTC: Sending ICE candidate via backend API:', {
      callId: this.currentCall.callId,
    });

    try {
      // Convert RTCIceCandidate to plain object for backend
      const candidateData = {
        candidate: candidate.candidate,
        sdpMLineIndex: candidate.sdpMLineIndex,
        sdpMid: candidate.sdpMid,
      };

      console.log('📞 WebRTC: ICE candidate data:', JSON.stringify(candidateData, null, 2));

      // Use backend API for signaling
      // For ICE candidates, we need to determine the receiver ID
      // Try to get the receiver ID from the current call data
      let receiverId: number | undefined = undefined;

      // If we have callerId and we're the receiver, send to caller
      if (this.currentCall.callerId && !this.isInitiator) {
        receiverId = parseInt(this.currentCall.callerId);
      }
      // If we have receiverId in currentCall and we're the caller, send to receiver
      else if (this.currentCall.receiverId && this.isInitiator) {
        receiverId = parseInt(this.currentCall.receiverId);
      }

      if (receiverId) {
        console.log('📞 WebRTC: Sending ICE candidate to user:', receiverId);
        await this.sendSignalingData(this.currentCall.callId, 'ice-candidate', candidateData, receiverId);
      } else {
        console.log('📞 WebRTC: Sending ICE candidate without toUserId (fallback)');
        await this.sendSignalingData(this.currentCall.callId, 'ice-candidate', candidateData);
      }
      console.log('✅ WebRTC: ICE candidate sent successfully via backend API');
    } catch (error) {
      console.error('❌ WebRTC: Failed to send ICE candidate via backend API:', error);
      // Fallback to socket method if backend fails
      socketService.getSocket()?.emit('webrtc_ice_candidate', {
        callId: this.currentCall.callId,
        candidate,
      });
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
    console.log(`📞 WebRTC: Added listener for: ${event}`);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (!this.eventListeners[event]) return;

    if (callback) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    } else {
      this.eventListeners[event] = [];
    }
    console.log(`📞 WebRTC: Removed listener for: ${event}`);
  }

  /**
   * Emit call events for UI handling
   */
  private emitCallEvent(event: string, data: CallEventData): void {
    console.log('📞 WebRTC: Emitting call event:', event, data);

    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ WebRTC: Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Public emit method for external use
   */
  emit(event: string, data: CallEventData): void {
    this.emitCallEvent(event, data);
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    console.log('📞 WebRTC: Cleaning up resources');
    this.localStream?.getTracks().forEach(track => {
      track.stop();
      console.log(`📞 WebRTC: Stopped local track: ${track.kind}`);
    });

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      console.log('📞 WebRTC: ✅ Peer connection closed');
    }
    // Stop InCallManager
    if (inCallManagerAvailable && InCallManager && typeof InCallManager.stop === 'function') {
      console.log('📞 WebRTC: Stopping InCallManager...');
      try {
        InCallManager.stop();
        console.log('📞 WebRTC: ✅ InCallManager stopped');
      } catch (error) {
        console.error('📞 WebRTC: Failed to stop InCallManager:', error);
      }
    } else {
      console.log('📞 WebRTC: InCallManager not available or stop method not found');
    }



    this.remoteStream = null;
    this.currentCall = null;
    this.isInitiator = false;
    this.signalingState = 'stable';
    this.queuedIceCandidates = [];
    // Event listeners are registered once for the lifetime of the service (e.g. callStore subscriptions).
    // Resetting them here prevented subsequent calls from receiving events after the first call ended.
    this.localStream = null;
    this.audioTrack = null;
    this.videoTrack = null;
    this.storedOffer = null;
    console.log('📞 WebRTC: Cleanup completed.');
  }

  /**
   * Get current call data
   */
  getCurrentCall(): CallData | null {
    return this.currentCall;
  }

  /**
   * Toggle speaker on/off
   */
  toggleSpeaker(enabled: boolean): void {
    if (inCallManagerAvailable && InCallManager && typeof InCallManager.setSpeakerphoneOn === 'function') {
      console.log('📞 WebRTC: Toggling speaker via InCallManager:', enabled);
      try {
        InCallManager.setSpeakerphoneOn(enabled);
        console.log('📞 WebRTC: ✅ Speaker toggled via InCallManager');
        // Stronger routing on Android if available
        if ('setForceSpeakerphoneOn' in InCallManager && typeof InCallManager.setForceSpeakerphoneOn === 'function') {
          try {
            InCallManager.setForceSpeakerphoneOn(enabled);
            console.log('📞 WebRTC: ✅ Force speakerphone routing toggled:', enabled);
          } catch (e) {
            console.warn('📞 WebRTC: setForceSpeakerphoneOn failed:', e);
          }
        }
      } catch (error) {
        console.error('📞 WebRTC: Failed to toggle speaker via InCallManager:', error);
        this.fallbackAudioRouting(enabled);
      }
    } else {
      console.log('📞 WebRTC: InCallManager not available - using fallback audio routing');
      this.fallbackAudioRouting(enabled);
    }
  }

  /**
   * Fallback audio routing when InCallManager is not available
   */
  private fallbackAudioRouting(enabled: boolean): void {
    console.log('📞 WebRTC: Using fallback audio routing, speaker:', enabled);

    try {
      // Force audio session activation
      if (this.localStream) {
        const audioTracks = this.localStream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = true;
          console.log('📞 WebRTC: Audio track enabled for fallback routing');
        });
      }

      // Force remote audio tracks to be enabled
      if (this.remoteStream) {
        const audioTracks = this.remoteStream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = true;
          console.log('📞 WebRTC: Remote audio track enabled for fallback routing');
        });
      }

      console.log('📞 WebRTC: ✅ Fallback audio routing applied');
    } catch (error) {
      console.error('📞 WebRTC: Fallback audio routing failed:', error);
    }
  }

  /**
   * Check if there's an incoming call
   */
  hasIncomingCall(): boolean {
    return this.currentCall !== null && this.currentCall.status === 'ringing' && !this.isInitiator;
  }

  /**
   * Test method to manually trigger signaling handling
   */
  testHandleSignaling(data: SignalingEventData): void {
    console.log('📞 WebRTC: Test handleSignaling called with:', data);
    this.handleSignaling(data);
  }

  /**
   * Test audio playback functionality
   */
  async testAudioPlayback(): Promise<{ success: boolean; stream?: MediaStream; url?: string; error?: unknown; message: string }> {
    try {
      console.log('📞 WebRTC: Testing audio playback...');

      // Test if we can get user media
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      console.log('📞 WebRTC: Test stream created:', {
        id: stream.id,
        active: stream.active,
        tracks: stream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState
        }))
      });

      // Test if we can play the stream through RTCView
      const streamURL = this.getStreamUrl(stream);
      console.log('📞 WebRTC: Test stream URL:', streamURL);

      return {
        success: true,
        stream: stream,
        url: streamURL,
        message: 'Audio playback test successful'
      };
    } catch (error) {
      console.error('📞 WebRTC: Audio playback test failed:', error);
      return {
        success: false,
        error: error,
        message: 'Audio playback test failed'
      };
    }
  }

  /**
   * Comprehensive audio debugging method
   */
  debugAudioIssues(): void {
    console.log('🔍 WebRTC Audio Debug Report:');
    console.log('================================');

    // Check InCallManager availability
    console.log('📞 InCallManager Available:', inCallManagerAvailable);
    if (inCallManagerAvailable && InCallManager) {
      console.log('📞 InCallManager Methods:', Object.keys(InCallManager));
    }

    // Check local stream
    console.log('📞 Local Stream:', {
      exists: !!this.localStream,
      active: this.localStream?.active,
      id: this.localStream?.id,
      url: this.getStreamUrl(this.localStream),
      tracks: this.localStream?.getTracks().length || 0
    });

    // Check remote stream
    console.log('📞 Remote Stream:', {
      exists: !!this.remoteStream,
      active: this.remoteStream?.active,
      id: this.remoteStream?.id,
      url: this.getStreamUrl(this.remoteStream),
      tracks: this.remoteStream?.getTracks().length || 0
    });

    // Check audio tracks
    if (this.audioTrack) {
      console.log('📞 Audio Track:', {
        enabled: this.audioTrack.enabled,
        muted: this.audioTrack.muted,
        readyState: this.audioTrack.readyState,
        id: this.audioTrack.id
      });
    } else {
      console.log('📞 Audio Track: Not available');
    }

    // Check peer connection
    console.log('📞 Peer Connection:', {
      exists: !!this.peerConnection,
      connectionState: this.peerConnection?.connectionState,
      iceConnectionState: this.peerConnection?.iceConnectionState,
      signalingState: this.peerConnection?.signalingState
    });

    // Check call state
    console.log('📞 Call State:', {
      currentCall: !!this.currentCall,
      isInitiator: this.isInitiator,
      callId: this.currentCall?.callId,
      status: this.currentCall?.status
    });

    console.log('================================');
  }

  /**
   * Test method to check socket connection and listeners
   */
  /**
   * Set current call (for manual testing)
   */
  setCurrentCall(callData: CallData): void {
    console.log('📞 WebRTC: Setting current call manually:', callData);
    this.currentCall = callData;
    this.isInitiator = false;
  }

  /**
   * Manually set offer data (for testing)
   */
  setManualOfferData(offerData: RTCSessionDescriptionInit): void {
    console.log('📞 WebRTC: Setting manual offer data:', offerData);
    global.manualOfferData = { offer: offerData, timestamp: Date.now() };
    global.latestOfferData = { offer: offerData, timestamp: Date.now() };
  }

  /**
   * Manually set answer data (for testing)
   */
  setManualAnswerData(answerData: RTCSessionDescriptionInit): void {
    console.log('📞 WebRTC: Setting manual answer data:', answerData);
    global.manualAnswerData = { callId: '', answer: answerData, timestamp: Date.now() };
    global.latestAnswerData = { callId: '', answer: answerData, timestamp: Date.now() };
  }

  /**
   * Start manual call connection (for testing without server)
   */
  async startManualCall(callId: string, isInitiator: boolean = false): Promise<void> {
    console.log('📞 WebRTC: Starting manual call:', { callId, isInitiator });

    try {
      // Get user media first
      await this.getUserMedia('audio');

      // Create peer connection
      await this.createPeerConnection();

      if (isInitiator) {
        // Initiator creates offer
        console.log('📞 WebRTC: Creating offer as initiator');
        const offer = await this.peerConnection!.createOffer();
        await this.peerConnection!.setLocalDescription(offer);

        // Store offer for manual exchange
        await this.storeOfferForManualExchange(offer);
      }

      console.log('✅ WebRTC: Manual call setup complete');
    } catch (error) {
      console.error('❌ WebRTC: Failed to start manual call:', error);
      throw error;
    }
  }

  /**
   * Store offer for manual exchange (simulate server storage)
   */
  private async storeOfferForManualExchange(offer: RTCSessionDescriptionInit): Promise<void> {
    // In a real app, this would be stored on server
    // For manual testing, we'll store it locally
    const offerData = {
      callId: this.currentCall?.callId,
      offer: offer,
      timestamp: Date.now()
    };

    console.log('📞 WebRTC: Stored offer for manual exchange:', offerData);

    try {
      // Store in AsyncStorage for persistence across app restarts
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('manualOfferData', JSON.stringify(offerData));
      console.log('📞 WebRTC: Offer data stored in AsyncStorage');
    } catch (error) {
      console.warn('📞 WebRTC: Failed to store in AsyncStorage, using global fallback:', error);
    }

    // Fallback: Store in global for manual testing
    global.manualOfferData = offerData;
    global.latestOfferData = offerData;
  }

  /**
   * Get stored offer for manual exchange
   */
  async getStoredOffer(callId: string): Promise<ManualOfferData | null> {
    try {
      // Try to get from AsyncStorage first
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const storedData = await AsyncStorage.getItem('manualOfferData');
      if (storedData) {
        const offerData = JSON.parse(storedData);
        console.log('📞 WebRTC: Retrieved offer from AsyncStorage:', offerData);
        return offerData;
      }
    } catch (error) {
      console.warn('📞 WebRTC: Failed to get from AsyncStorage:', error);
    }

    // Fallback: Try to get offer by call ID from global
    const offerData = global.manualOfferData;
    if (offerData && offerData.callId === callId) {
      console.log('📞 WebRTC: Retrieved stored offer by call ID:', offerData);
      return offerData;
    }

    // Fallback: get the latest offer data (for manual testing)
    const latestOfferData = global.latestOfferData;
    if (latestOfferData) {
      console.log('📞 WebRTC: Retrieved latest offer data:', latestOfferData);
      return latestOfferData;
    }

    console.log('📞 WebRTC: No stored offer found for call ID:', callId);
    return null;
  }

  /**
   * Answer manual call with stored offer
   */
  async answerManualCall(callId: string): Promise<void> {
    console.log('📞 WebRTC: Answering manual call:', callId);

    try {
      // Check if peer connection exists
      if (!this.peerConnection) {
        console.error('📞 WebRTC: No peer connection exists');
        throw new Error('Peer connection not initialized. Please join the call first.');
      }

      // Debug: Check what's stored globally
      console.log('📞 WebRTC: Debug - Global storage:', {
        manualOfferData: global.manualOfferData,
        latestOfferData: global.latestOfferData,
        callId: callId
      });

      const offerData = await this.getStoredOffer(callId);
      if (!offerData) {
        console.error('📞 WebRTC: No offer data found. Available data:', {
          manualOfferData: global.manualOfferData,
          latestOfferData: global.latestOfferData
        });
        throw new Error('No stored offer found for call ID: ' + callId + '. Make sure the caller has started the call first.');
      }

      console.log('📞 WebRTC: Using offer data:', offerData);

      // Set remote description (the offer)
      console.log('📞 WebRTC: Setting remote description...');
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerData.offer));
      console.log('📞 WebRTC: Remote description set successfully');

      // Create answer
      console.log('📞 WebRTC: Creating answer...');
      const answer = await this.peerConnection.createAnswer();
      console.log('📞 WebRTC: Answer created:', answer);

      await this.peerConnection.setLocalDescription(answer);
      console.log('📞 WebRTC: Local description set successfully');

      // Store answer for manual exchange
      await this.storeAnswerForManualExchange(answer, callId);

      console.log('✅ WebRTC: Manual call answered');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('❌ WebRTC: Failed to answer manual call:', error);
      console.error('❌ WebRTC: Error details:', {
        message: errorMessage,
        stack: errorStack,
        name: error.name
      });
      throw error;
    }
  }

  /**
   * Store answer for manual exchange
   */
  private async storeAnswerForManualExchange(answer: RTCSessionDescriptionInit, callId: string): Promise<void> {
    const answerData = {
      callId: callId,
      answer: answer,
      timestamp: Date.now()
    };

    console.log('📞 WebRTC: Stored answer for manual exchange:', answerData);

    try {
      // Store in AsyncStorage for persistence
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('manualAnswerData', JSON.stringify(answerData));
      console.log('📞 WebRTC: Answer data stored in AsyncStorage');
    } catch (error) {
      console.warn('📞 WebRTC: Failed to store answer in AsyncStorage:', error);
    }

    // Fallback: Store in global
    global.manualAnswerData = answerData;
    global.latestAnswerData = answerData;
  }

  /**
   * Get stored answer for manual exchange
   */
  async getStoredAnswer(callId: string): Promise<ManualAnswerData | null> {
    try {
      // Try to get from AsyncStorage first
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const storedData = await AsyncStorage.getItem('manualAnswerData');
      if (storedData) {
        const answerData = JSON.parse(storedData);
        console.log('📞 WebRTC: Retrieved answer from AsyncStorage:', answerData);
        return answerData;
      }
    } catch (error) {
      console.warn('📞 WebRTC: Failed to get answer from AsyncStorage:', error);
    }

    // Fallback: Try to get answer by call ID from global
    const answerData = global.manualAnswerData;
    if (answerData && answerData.callId === callId) {
      console.log('📞 WebRTC: Retrieved stored answer by call ID:', answerData);
      return answerData;
    }

    // Fallback: get the latest answer data (for manual testing)
    const latestAnswerData = global.latestAnswerData;
    if (latestAnswerData) {
      console.log('📞 WebRTC: Retrieved latest answer data:', latestAnswerData);
      return latestAnswerData;
    }

    console.log('📞 WebRTC: No stored answer found for call ID:', callId);
    return null;
  }

  /**
   * Complete manual call setup with answer
   */
  async completeManualCall(callId: string): Promise<void> {
    console.log('📞 WebRTC: Completing manual call setup:', callId);

    try {
      // Check if peer connection exists
      if (!this.peerConnection) {
        console.error('📞 WebRTC: No peer connection exists');
        throw new Error('Peer connection not initialized. Please start the call first.');
      }

      // Check current signaling state
      const currentState = `${this.peerConnection.signalingState}`;
      console.log('📞 WebRTC: Current signaling state:', currentState);

      // If already stable, we don't need to set remote description again
      if (currentState === 'stable') {
        console.log('📞 WebRTC: Connection already stable, no need to set remote description');
        console.log('✅ WebRTC: Manual call setup completed (already stable)');
        return;
      }

      const answerData = await this.getStoredAnswer(callId);
      if (!answerData) {
        console.error('📞 WebRTC: No answer data found for call ID:', callId);
        throw new Error('No stored answer found for call ID: ' + callId + '. Make sure the receiver has answered the call first.');
      }

      console.log('📞 WebRTC: Using answer data:', answerData);

      // Only set remote description if not already stable
      if (currentState !== 'stable') {
        console.log('📞 WebRTC: Setting remote description with answer...');
        await this.peerConnection.setRemoteDescription(answerData.answer);
        console.log('📞 WebRTC: Remote description set with answer successfully');
      }

      console.log('✅ WebRTC: Manual call setup completed');
    } catch (error) {
      console.error('❌ WebRTC: Failed to complete manual call:', error);
      console.error('❌ WebRTC: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    return this.peerConnection?.connectionState || 'unknown';
  }

  /**
   * Get ICE connection state
   */
  getIceConnectionState(): string {
    return this.peerConnection?.iceConnectionState || 'unknown';
  }

  /**
   * Get signaling state
   */
  getSignalingState(): string {
    return this.peerConnection?.signalingState || 'unknown';
  }

  /**
   * Check if this device is the call initiator
   */
  isCallInitiator(): boolean {
    return this.isInitiator;
  }

  /**
   * Check if call is active
   */
  isCallActive(): boolean {
    return this.currentCall !== null;
  }

  /**
   * Mute/unmute audio
   */
  toggleAudio(): boolean {
    if (this.audioTrack) {
      this.audioTrack.enabled = !this.audioTrack.enabled;
      console.log('📞 WebRTC: Audio track enabled:', this.audioTrack.enabled);
      return this.audioTrack.enabled;
    }
    return false;
  }

  /**
   * Enable/disable video
   */
  toggleVideo(): boolean {
    if (this.videoTrack) {
      this.videoTrack.enabled = !this.videoTrack.enabled;
      console.log('📞 WebRTC: Video track enabled:', this.videoTrack.enabled);
      return this.videoTrack.enabled;
    }
    return false;
  }

  /**
   * Get audio track state
   */
  isAudioEnabled(): boolean {
    return this.audioTrack ? this.audioTrack.enabled : false;
  }

  /**
   * Get video track state
   */
  isVideoEnabled(): boolean {
    return this.videoTrack ? this.videoTrack.enabled : false;
  }

  /**
   * Check if microphone is active (for debugging)
   */
  isMicrophoneActive(): boolean {
    if (!this.audioTrack) return false;
    return this.audioTrack.enabled && this.audioTrack.readyState === 'live';
  }

  /**
   * Get detailed audio track info (for debugging)
   */
  getAudioTrackInfo(): AudioTrackInfo | null {
    if (!this.audioTrack) return null;

    return {
      enabled: this.audioTrack.enabled,
      readyState: this.audioTrack.readyState,
      id: this.audioTrack.id,
      kind: this.audioTrack.kind,
      muted: this.audioTrack.muted,
      settings: this.audioTrack.getSettings ? this.audioTrack.getSettings() : undefined
    };
  }

  /**
   * Force enable microphone (for debugging)
   */
  forceEnableMicrophone(): boolean {
    if (!this.audioTrack) {
      console.log('📞 WebRTC: No audio track to enable');
      return false;
    }

    try {
      this.audioTrack.enabled = true;
      console.log('📞 WebRTC: ✅ Forced microphone enabled');
      return true;
    } catch (error) {
      console.error('❌ WebRTC: Failed to force enable microphone:', error);
      return false;
    }
  }

  /**
   * Debug audio tracks and streams
   */
  debugAudioStatus(): void {
    console.log('🎤 WebRTC Audio Debug:');
    console.log('Local Stream:', {
      exists: !!this.localStream,
      active: this.localStream?.active,
      id: this.localStream?.id,
      tracks: this.localStream?.getTracks().map(track => ({
        kind: track.kind,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      }))
    });

    console.log('Remote Stream:', {
      exists: !!this.remoteStream,
      active: this.remoteStream?.active,
      id: this.remoteStream?.id,
      tracks: this.remoteStream?.getTracks().map(track => ({
        kind: track.kind,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      }))
    });

    console.log('Audio Track:', {
      exists: !!this.audioTrack,
      enabled: this.audioTrack?.enabled,
      muted: this.audioTrack?.muted,
      readyState: this.audioTrack?.readyState
    });

    console.log('Peer Connection:', {
      exists: !!this.peerConnection,
      connectionState: this.peerConnection?.connectionState,
      iceConnectionState: this.peerConnection?.iceConnectionState,
      signalingState: this.peerConnection?.signalingState
    });
  }

  /**
   * Force enable all audio tracks
   */
  forceEnableAllAudio(): void {
    console.log('🎤 WebRTC: Force enabling all audio...');

    // Enable local audio track
    if (this.audioTrack) {
      this.audioTrack.enabled = true;
      console.log('🎤 Local audio track enabled');
    }

    // Enable all audio tracks in local stream
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = true;
        console.log('🎤 Local stream audio track enabled');
      });
    }

    // Enable all audio tracks in remote stream
    if (this.remoteStream) {
      this.remoteStream.getAudioTracks().forEach(track => {
        track.enabled = true;
        console.log('🎤 Remote stream audio track enabled');
      });
    }

    console.log('🎤 All audio tracks force enabled');
  }

  /**
   * Test microphone activation
   */
  async testMicrophoneActivation(): Promise<boolean> {
    try {
      console.log('🎤 WebRTC: Testing microphone activation...');

      if (!this.localStream) {
        console.log('🎤 WebRTC: No local stream, getting user media...');
        await this.getUserMedia('audio');
      }

      if (this.audioTrack) {
        console.log('🎤 WebRTC: Audio track status:', {
          enabled: this.audioTrack.enabled,
          readyState: this.audioTrack.readyState,
          muted: this.audioTrack.muted
        });

        // Force enable the track
        this.audioTrack.enabled = true;

        // Check if track is live
        const isLive = this.audioTrack.readyState === 'live';
        console.log('🎤 WebRTC: Microphone is live:', isLive);

        return isLive;
      } else {
        console.error('🎤 WebRTC: No audio track found');
        return false;
      }
    } catch (error) {
      console.error('🎤 WebRTC: Microphone test failed:', error);
      return false;
    }
  }

  /**
   * Force audio session activation to show microphone in status bar
   */
  async forceAudioSessionActivation(): Promise<boolean> {
    try {
      console.log('🎤 WebRTC: Forcing audio session activation...');

      if (!this.localStream) {
        console.log('🎤 WebRTC: No local stream, getting user media...');
        await this.getUserMedia('audio');
      }

      if (this.audioTrack) {
        // Force enable the audio track
        this.audioTrack.enabled = true;

        // Force track to be live by toggling
        this.audioTrack.enabled = false;
        setTimeout(() => {
          if (this.audioTrack) {
            this.audioTrack.enabled = true;
            console.log('🎤 WebRTC: Audio track toggled to force activation');
          }
        }, 100);

        console.log('🎤 WebRTC: Audio session activation methods applied');

        // Check if track is live
        const isLive = this.audioTrack.readyState === 'live';
        console.log('🎤 WebRTC: Audio session activation result:', isLive);

        return isLive;
      } else {
        console.error('🎤 WebRTC: No audio track found');
        return false;
      }
    } catch (error) {
      console.error('🎤 WebRTC: Audio session activation failed:', error);
      return false;
    }
  }

  /**
   * Queue ICE candidate for later processing
   */
  private queueIceCandidate(candidate: RTCIceCandidateInit): void {
    // Ensure queued candidate has at least one of sdpMid/sdpMLineIndex to avoid errors later
    const sanitized = { ...candidate } as RTCIceCandidateInit;
    if (sanitized && sanitized.sdpMid == null && sanitized.sdpMLineIndex == null) {
      console.warn('📞 WebRTC: Queued ICE candidate missing sdpMid/sdpMLineIndex, applying fallback sdpMLineIndex=0');
      sanitized.sdpMLineIndex = 0;
    }
    this.queuedIceCandidates.push(sanitized);
    console.log('📞 WebRTC: Queued ICE candidate, total queued:', this.queuedIceCandidates.length);
  }

  /**
   * Process all queued ICE candidates
   */
  private async processQueuedIceCandidates(): Promise<void> {
    if (this.queuedIceCandidates.length === 0) return;

    console.log('📞 WebRTC: Processing', this.queuedIceCandidates.length, 'queued ICE candidates');

    for (const candidateInit of this.queuedIceCandidates) {
      try {
        const sanitized = { ...candidateInit } as RTCIceCandidateInit;
        if (sanitized && sanitized.sdpMid == null && sanitized.sdpMLineIndex == null) {
          console.warn('📞 WebRTC: Queued ICE candidate missing sdpMid/sdpMLineIndex during processing, applying fallback sdpMLineIndex=0');
          sanitized.sdpMLineIndex = 0;
        }
        const candidate = new RTCIceCandidate(sanitized);
        await this.peerConnection?.addIceCandidate(candidate);
        console.log('📞 WebRTC: Processed queued ICE candidate');
      } catch (error) {
        console.error('❌ WebRTC: Failed to process queued ICE candidate:', error);
      }
    }

    this.queuedIceCandidates = [];
  }
}

const _webrtcService = new WebRTCService();
export const webrtcService = _webrtcService;
export default _webrtcService;

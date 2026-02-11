/**
 * Call Event Emitter
 * Simple event system for call events
 * @format
 */

import { DeviceEventEmitter } from 'react-native';

export const CallEventEmitter = {
  // Event names
  INCOMING_CALL: 'incoming_call',
  CALL_ACCEPTED: 'call_accepted',
  CALL_DECLINED: 'call_declined',
  CALL_ENDED: 'call_ended',

  // Emit incoming call event
  emitIncomingCall: (callData: any) => {
    console.log('📞 CallEventEmitter: Emitting incoming call event:', callData);
    DeviceEventEmitter.emit('incoming_call', callData);
  },

  // Emit call accepted event
  emitCallAccepted: (callData: any) => {
    console.log('📞 CallEventEmitter: Emitting call accepted event:', callData);
    DeviceEventEmitter.emit('call_accepted', callData);
  },

  // Emit call declined event
  emitCallDeclined: (callData: any) => {
    console.log('📞 CallEventEmitter: Emitting call declined event:', callData);
    DeviceEventEmitter.emit('call_declined', callData);
  },

  // Emit call ended event
  emitCallEnded: (callData: any) => {
    console.log('📞 CallEventEmitter: Emitting call ended event:', callData);
    DeviceEventEmitter.emit('call_ended', callData);
  },

  // Listen for incoming call
  onIncomingCall: (callback: (callData: any) => void) => {
    console.log('📞 CallEventEmitter: Adding incoming call listener');
    return DeviceEventEmitter.addListener('incoming_call', callback);
  },

  // Listen for call accepted
  onCallAccepted: (callback: (callData: any) => void) => {
    console.log('📞 CallEventEmitter: Adding call accepted listener');
    return DeviceEventEmitter.addListener('call_accepted', callback);
  },

  // Listen for call declined
  onCallDeclined: (callback: (callData: any) => void) => {
    console.log('📞 CallEventEmitter: Adding call declined listener');
    return DeviceEventEmitter.addListener('call_declined', callback);
  },

  // Listen for call ended
  onCallEnded: (callback: (callData: any) => void) => {
    console.log('📞 CallEventEmitter: Adding call ended listener');
    return DeviceEventEmitter.addListener('call_ended', callback);
  },
};

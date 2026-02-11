/**
 * Socket Event Constants
 * Centralized event names to follow DRY principle and avoid typos
 */

// Connection Events
export const CONNECTION_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
} as const;

// Authentication Events
export const AUTH_EVENTS = {
  AUTHENTICATE: 'authenticate',
  AUTH_ERROR: 'auth_error',
} as const;

// User Status Events
export const USER_STATUS_EVENTS = {
  USER_STATUS_UPDATE: 'user_status_update',
  USER_ONLINE_STATUS: 'user_online_status',
  ONLINE_USERS_LIST: 'online_users_list',
  ONLINE_USERS_UPDATED: 'online_users_updated',
} as const;

// Conversation Events
export const CONVERSATION_EVENTS = {
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_TYPING_START: 'user_typing_start',
  USER_TYPING_STOP: 'user_typing_stop',
} as const;

// Message Events
export const MESSAGE_EVENTS = {
  NEW_MESSAGE: 'new_message',
  MESSAGE_READ: 'messages_read',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_RECEIVED: 'message_received',
  SYSTEM_MESSAGE: 'system_message',
} as const;

// Job Events
export const JOB_EVENTS = {
  JOB_NEW: 'job:new',
  JOB_ASSIGNED: 'job_assigned',
  JOB_COMPLETED: 'job_completed',
} as const;

// Contract Events
export const CONTRACT_EVENTS = {
  CONTRACT_CREATED: 'contract_created',
  CONTRACT_STARTED: 'contract_started',
  CONTRACT_DRIVER_ADDED: 'contract_driver_added',
  CONTRACT_DRIVER_REMOVED: 'contract_driver_removed',
  CONTRACT_DRIVER_CHANGED: 'contract_driver_changed',
  CONTRACT_DRIVER_INVITED: 'contract_driver_invited',
  CONTRACT_DRIVER_ACCEPTED: 'contract_driver_accepted',
  CONTRACT_DRIVER_DECLINED: 'contract_driver_declined',
  CONTRACT_DRIVER_VISIBILITY_CHANGED: 'contract_driver_visibility_changed',
  CONTRACT_CARRIER_INVITED: 'contract_carrier_invited',
  CONTRACT_CARRIER_ACCEPTED: 'contract_carrier_accepted',
  CONTRACT_CARRIER_DECLINED: 'contract_carrier_declined',
} as const;

// Location Tracking Events
export const LOCATION_EVENTS = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  UPDATE_LOCATION: 'update_location',
  LOCATION_UPDATE: 'location_update',
  LOCATION_ERROR: 'location_error',
} as const;

// WebRTC Events
export const WEBRTC_EVENTS = {
  CALL_INCOMING: 'call_incoming',
  CALL_ACCEPTED: 'call_accepted',
  CALL_DECLINED: 'call_declined',
  CALL_ENDED: 'call_ended',
  CALL_JOINED: 'call_joined',
  WEBRTC_SIGNALING: 'webrtc_signaling',
  CALL_STATUS_UPDATE: 'call_status_update',
} as const;

// Error Events
export const ERROR_EVENTS = {
  ERROR: 'error',
  TYPING_ERROR: 'typing_error',
} as const;

// Room Prefixes
export const ROOM_PREFIXES = {
  USER: 'user:',
  CONVERSATION: 'conversation:',
} as const;

// All Events (for validation)
export const ALL_EVENTS = {
  ...CONNECTION_EVENTS,
  ...AUTH_EVENTS,
  ...USER_STATUS_EVENTS,
  ...CONVERSATION_EVENTS,
  ...MESSAGE_EVENTS,
  ...JOB_EVENTS,
  ...CONTRACT_EVENTS,
  ...LOCATION_EVENTS,
  ...WEBRTC_EVENTS,
  ...ERROR_EVENTS,
} as const;

// Event Types
export type ConnectionEvent = typeof CONNECTION_EVENTS[keyof typeof CONNECTION_EVENTS];
export type AuthEvent = typeof AUTH_EVENTS[keyof typeof AUTH_EVENTS];
export type UserStatusEvent = typeof USER_STATUS_EVENTS[keyof typeof USER_STATUS_EVENTS];
export type ConversationEvent = typeof CONVERSATION_EVENTS[keyof typeof CONVERSATION_EVENTS];
export type MessageEvent = typeof MESSAGE_EVENTS[keyof typeof MESSAGE_EVENTS];
export type JobEvent = typeof JOB_EVENTS[keyof typeof JOB_EVENTS];
export type ContractEvent = typeof CONTRACT_EVENTS[keyof typeof CONTRACT_EVENTS];
export type LocationEvent = typeof LOCATION_EVENTS[keyof typeof LOCATION_EVENTS];
export type WebRTCEvent = typeof WEBRTC_EVENTS[keyof typeof WEBRTC_EVENTS];
export type ErrorEvent = typeof ERROR_EVENTS[keyof typeof ERROR_EVENTS];
export type SocketEvent = typeof ALL_EVENTS[keyof typeof ALL_EVENTS];

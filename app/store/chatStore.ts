import { create } from "zustand";
import {
  Message,
  Conversation,
  Call,
  CallStatus,
  MessageStatus,
} from "@app/types";

// Mock data for conversations
const mockConversations: Conversation[] = [
  {
    id: "conv1",
    participants: ["driver1", "merchant1"],
    unreadCount: 2,
    jobId: "j1",
    createdAt: "2025-06-01T10:00:00Z",
    updatedAt: "2025-06-07T15:30:00Z",
    messages: [],
    lastMessage: {
      id: "msg3",
      conversationId: "conv1",
      senderId: "driver1",
      receiverId: "merchant1",
      type: "text",
      content: "I'm about 30 minutes away from the pickup location.",
      timestamp: "2025-06-07T15:35:00Z",
      read: true,
      delivered: true,
      status: "read",
      jobId: "j1",
    },
  },
  {
    id: "conv2",
    participants: ["driver1", "merchant2"],
    unreadCount: 0,
    jobId: "j2",
    createdAt: "2025-05-28T14:20:00Z",
    updatedAt: "2025-06-05T09:45:00Z",
    messages: [],
    lastMessage: {
      id: "msg4",
      conversationId: "conv2",
      senderId: "merchant2",
      receiverId: "driver1",
      type: "text",
      content: "The delivery was completed successfully. Thank you!",
      timestamp: "2025-06-05T09:45:00Z",
      read: true,
      delivered: true,
      status: "read",
      jobId: "j2",
    },
    pinned: true,
  },
  {
    id: "conv3",
    participants: ["driver1", "merchant3"],
    unreadCount: 3,
    jobId: "j3",
    createdAt: "2025-06-02T08:15:00Z",
    updatedAt: "2025-06-07T11:20:00Z",
    messages: [],
    lastMessage: {
      id: "msg7",
      conversationId: "conv3",
      senderId: "merchant3",
      receiverId: "driver1",
      type: "image",
      content: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3",
      timestamp: "2025-06-07T11:20:00Z",
      read: false,
      delivered: true,
      status: "delivered",
      jobId: "j3",
    },
  },
  {
    id: "conv4",
    participants: ["driver1", "merchant4"],
    unreadCount: 1,
    jobId: "j4",
    createdAt: "2025-06-03T16:40:00Z",
    updatedAt: "2025-06-06T18:10:00Z",
    messages: [],
    lastMessage: {
      id: "msg10",
      conversationId: "conv4",
      senderId: "merchant4",
      receiverId: "driver1",
      type: "voice",
      content: "voice_message_url",
      timestamp: "2025-06-06T18:10:00Z",
      read: false,
      delivered: true,
      status: "delivered",
      jobId: "j4",
    },
    muted: true,
  },
  {
    id: "conv5",
    participants: ["driver1", "m1"],
    unreadCount: 0,
    jobId: "j5",
    createdAt: "2025-06-04T09:30:00Z",
    updatedAt: "2025-06-07T14:15:00Z",
    messages: [],
    lastMessage: {
      id: "msg15",
      conversationId: "conv5",
      senderId: "m1",
      receiverId: "driver1",
      type: "text",
      content: "Please confirm when you arrive at the warehouse.",
      timestamp: "2025-06-07T14:15:00Z",
      read: true,
      delivered: true,
      status: "read",
      jobId: "j5",
    },
  },
  {
    id: "conv6",
    participants: ["driver1", "m2"],
    unreadCount: 4,
    jobId: "j6",
    createdAt: "2025-06-05T11:45:00Z",
    updatedAt: "2025-06-07T16:20:00Z",
    messages: [],
    lastMessage: {
      id: "msg20",
      conversationId: "conv6",
      senderId: "m2",
      receiverId: "driver1",
      type: "location",
      content: JSON.stringify({ latitude: 37.7749, longitude: -122.4194 }),
      timestamp: "2025-06-07T16:20:00Z",
      read: false,
      delivered: true,
      status: "delivered",
      jobId: "j6",
    },
  },
  {
    id: "conv7",
    participants: ["driver1", "merchant5"],
    unreadCount: 0,
    createdAt: "2025-05-20T13:10:00Z",
    updatedAt: "2025-05-25T17:30:00Z",
    messages: [],
    lastMessage: {
      id: "msg25",
      conversationId: "conv7",
      senderId: "driver1",
      receiverId: "merchant5",
      type: "text",
      content: "Looking forward to working with you on future jobs.",
      timestamp: "2025-05-25T17:30:00Z",
      read: true,
      delivered: true,
      status: "read",
    },
    archived: true,
  },
  {
    id: "conv8",
    participants: ["driver1", "merchant1"],
    unreadCount: 0,
    jobId: "j8",
    createdAt: "2025-06-06T08:30:00Z",
    updatedAt: "2025-06-07T19:45:00Z",
    messages: [],
    lastMessage: {
      id: "msg30",
      conversationId: "conv8",
      senderId: "merchant1",
      receiverId: "driver1",
      type: "document",
      content: "document_url",
      timestamp: "2025-06-07T19:45:00Z",
      read: true,
      delivered: true,
      status: "read",
      jobId: "j8",
      metadata: {
        fileName: "delivery_instructions.pdf",
        fileSize: 1024,
      },
    },
  },
  {
    id: "conv9",
    participants: ["driver1", "merchant2"],
    unreadCount: 2,
    createdAt: "2025-06-07T10:15:00Z",
    updatedAt: "2025-06-07T20:30:00Z",
    messages: [],
    lastMessage: {
      id: "msg35",
      conversationId: "conv9",
      senderId: "merchant2",
      receiverId: "driver1",
      type: "text",
      content: "Are you available for a new job next week?",
      timestamp: "2025-06-07T20:30:00Z",
      read: false,
      delivered: true,
      status: "delivered",
    },
  },
  {
    id: "conv10",
    participants: ["driver1", "merchant3"],
    unreadCount: 0,
    jobId: "j10",
    createdAt: "2025-06-05T14:20:00Z",
    updatedAt: "2025-06-07T18:10:00Z",
    messages: [],
    lastMessage: {
      id: "msg40",
      conversationId: "conv10",
      senderId: "driver1",
      receiverId: "merchant3",
      type: "text",
      content:
        "I have completed the delivery and uploaded the proof of delivery.",
      timestamp: "2025-06-07T18:10:00Z",
      read: true,
      delivered: true,
      status: "read",
      jobId: "j10",
    },
    pinned: true,
  },
];

// Mock data for messages
const mockMessages: Message[] = [
  // Conversation 1
  {
    id: "msg1",
    conversationId: "conv1",
    senderId: "merchant1",
    receiverId: "driver1",
    type: "text",
    content: "Hello, is the cargo ready for pickup?",
    timestamp: "2025-06-07T15:30:00Z",
    read: false,
    delivered: true,
    status: "delivered",
    jobId: "j1",
  },
  {
    id: "msg2",
    conversationId: "conv1",
    senderId: "merchant1",
    receiverId: "driver1",
    type: "text",
    content: "Please confirm your ETA.",
    timestamp: "2025-06-07T15:32:00Z",
    read: false,
    delivered: true,
    status: "delivered",
    jobId: "j1",
  },
  {
    id: "msg3",
    conversationId: "conv1",
    senderId: "driver1",
    receiverId: "merchant1",
    type: "text",
    content: "I'm about 30 minutes away from the pickup location.",
    timestamp: "2025-06-07T15:35:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j1",
  },

  // Conversation 2
  {
    id: "msg4",
    conversationId: "conv2",
    senderId: "merchant2",
    receiverId: "driver1",
    type: "text",
    content: "The delivery was completed successfully. Thank you!",
    timestamp: "2025-06-05T09:45:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j2",
  },

  // Conversation 3
  {
    id: "msg5",
    conversationId: "conv3",
    senderId: "merchant3",
    receiverId: "driver1",
    type: "text",
    content: "Hi, I need to send you the details of the cargo.",
    timestamp: "2025-06-07T11:10:00Z",
    read: false,
    delivered: true,
    status: "delivered",
    jobId: "j3",
  },
  {
    id: "msg6",
    conversationId: "conv3",
    senderId: "merchant3",
    receiverId: "driver1",
    type: "text",
    content: "Here is the manifest:",
    timestamp: "2025-06-07T11:15:00Z",
    read: false,
    delivered: true,
    status: "delivered",
    jobId: "j3",
  },
  {
    id: "msg7",
    conversationId: "conv3",
    senderId: "merchant3",
    receiverId: "driver1",
    type: "image",
    content: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3",
    timestamp: "2025-06-07T11:20:00Z",
    read: false,
    delivered: true,
    status: "delivered",
    jobId: "j3",
  },

  // Conversation 4
  {
    id: "msg8",
    conversationId: "conv4",
    senderId: "driver1",
    receiverId: "merchant4",
    type: "text",
    content: "I have arrived at the warehouse.",
    timestamp: "2025-06-06T18:00:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j4",
  },
  {
    id: "msg9",
    conversationId: "conv4",
    senderId: "driver1",
    receiverId: "merchant4",
    type: "image",
    content: "https://images.unsplash.com/photo-1566207474742-0fa4e3af9b5d",
    timestamp: "2025-06-06T18:05:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j4",
  },
  {
    id: "msg10",
    conversationId: "conv4",
    senderId: "merchant4",
    receiverId: "driver1",
    type: "voice",
    content: "voice_message_url",
    timestamp: "2025-06-06T18:10:00Z",
    read: false,
    delivered: true,
    status: "delivered",
    jobId: "j4",
    metadata: {
      duration: 45,
    },
  },

  // Conversation 5 (with real merchant m1)
  {
    id: "msg11",
    conversationId: "conv5",
    senderId: "driver1",
    receiverId: "m1",
    type: "text",
    content: "Good morning, I am assigned to pick up the shipment for job #J5.",
    timestamp: "2025-06-07T09:00:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j5",
  },
  {
    id: "msg12",
    conversationId: "conv5",
    senderId: "m1",
    receiverId: "driver1",
    type: "text",
    content:
      "Good morning! The shipment will be ready at 2 PM. Please arrive on time.",
    timestamp: "2025-06-07T09:05:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j5",
  },
  {
    id: "msg13",
    conversationId: "conv5",
    senderId: "driver1",
    receiverId: "m1",
    type: "text",
    content:
      "I will be there at 2 PM sharp. Is there a specific loading dock I should use?",
    timestamp: "2025-06-07T09:10:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j5",
  },
  {
    id: "msg14",
    conversationId: "conv5",
    senderId: "m1",
    receiverId: "driver1",
    type: "text",
    content:
      "Yes, please use loading dock #3. Ask for Mike at the security gate.",
    timestamp: "2025-06-07T09:15:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j5",
  },
  {
    id: "msg15",
    conversationId: "conv5",
    senderId: "m1",
    receiverId: "driver1",
    type: "text",
    content: "Please confirm when you arrive at the warehouse.",
    timestamp: "2025-06-07T14:15:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j5",
  },

  // Conversation 6 (with real merchant m2)
  {
    id: "msg16",
    conversationId: "conv6",
    senderId: "m2",
    receiverId: "driver1",
    type: "text",
    content:
      "Hello, we have an urgent delivery that needs to be picked up today.",
    timestamp: "2025-06-07T16:00:00Z",
    read: false,
    delivered: true,
    status: "delivered",
    jobId: "j6",
  },
  {
    id: "msg17",
    conversationId: "conv6",
    senderId: "m2",
    receiverId: "driver1",
    type: "text",
    content: "The cargo is fragile and requires special handling.",
    timestamp: "2025-06-07T16:05:00Z",
    read: false,
    delivered: true,
    status: "delivered",
    jobId: "j6",
  },
  {
    id: "msg18",
    conversationId: "conv6",
    senderId: "m2",
    receiverId: "driver1",
    type: "image",
    content: "https://images.unsplash.com/photo-1566207474742-0fa4e3af9b5d",
    timestamp: "2025-06-07T16:10:00Z",
    read: false,
    delivered: true,
    status: "delivered",
    jobId: "j6",
  },
  {
    id: "msg19",
    conversationId: "conv6",
    senderId: "m2",
    receiverId: "driver1",
    type: "text",
    content: "Here is the pickup location:",
    timestamp: "2025-06-07T16:15:00Z",
    read: false,
    delivered: true,
    status: "delivered",
    jobId: "j6",
  },
  {
    id: "msg20",
    conversationId: "conv6",
    senderId: "m2",
    receiverId: "driver1",
    type: "location",
    content: JSON.stringify({ latitude: 37.7749, longitude: -122.4194 }),
    timestamp: "2025-06-07T16:20:00Z",
    read: false,
    delivered: true,
    status: "delivered",
    jobId: "j6",
    metadata: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  },

  // Conversation 7 (archived)
  {
    id: "msg21",
    conversationId: "conv7",
    senderId: "merchant5",
    receiverId: "driver1",
    type: "text",
    content: "Thank you for completing the delivery last week.",
    timestamp: "2025-05-25T17:00:00Z",
    read: true,
    delivered: true,
    status: "read",
  },
  {
    id: "msg22",
    conversationId: "conv7",
    senderId: "driver1",
    receiverId: "merchant5",
    type: "text",
    content: "You are welcome! It was a pleasure working with your team.",
    timestamp: "2025-05-25T17:15:00Z",
    read: true,
    delivered: true,
    status: "read",
  },
  {
    id: "msg23",
    conversationId: "conv7",
    senderId: "merchant5",
    receiverId: "driver1",
    type: "text",
    content: "We will definitely keep you in mind for future jobs.",
    timestamp: "2025-05-25T17:20:00Z",
    read: true,
    delivered: true,
    status: "read",
  },
  {
    id: "msg24",
    conversationId: "conv7",
    senderId: "merchant5",
    receiverId: "driver1",
    type: "text",
    content: "Have a great day!",
    timestamp: "2025-05-25T17:25:00Z",
    read: true,
    delivered: true,
    status: "read",
  },
  {
    id: "msg25",
    conversationId: "conv7",
    senderId: "driver1",
    receiverId: "merchant5",
    type: "text",
    content: "Looking forward to working with you on future jobs.",
    timestamp: "2025-05-25T17:30:00Z",
    read: true,
    delivered: true,
    status: "read",
  },

  // Conversation 8
  {
    id: "msg26",
    conversationId: "conv8",
    senderId: "driver1",
    receiverId: "merchant1",
    type: "text",
    content: "I need the delivery instructions for job #J8.",
    timestamp: "2025-06-07T19:30:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j8",
  },
  {
    id: "msg27",
    conversationId: "conv8",
    senderId: "merchant1",
    receiverId: "driver1",
    type: "text",
    content: "Sure, let me send you the document with all the details.",
    timestamp: "2025-06-07T19:35:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j8",
  },
  {
    id: "msg28",
    conversationId: "conv8",
    senderId: "merchant1",
    receiverId: "driver1",
    type: "document",
    content: "document_url",
    timestamp: "2025-06-07T19:45:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j8",
    metadata: {
      fileName: "delivery_instructions.pdf",
      fileSize: 1024,
    },
  },

  // Conversation 9
  {
    id: "msg29",
    conversationId: "conv9",
    senderId: "merchant2",
    receiverId: "driver1",
    type: "text",
    content: "Hi John, this is Emily from XYZ Shipping.",
    timestamp: "2025-06-07T20:15:00Z",
    read: false,
    delivered: true,
    status: "delivered",
  },
  {
    id: "msg30",
    conversationId: "conv9",
    senderId: "merchant2",
    receiverId: "driver1",
    type: "text",
    content: "I was impressed with your work on our last delivery.",
    timestamp: "2025-06-07T20:20:00Z",
    read: false,
    delivered: true,
    status: "delivered",
  },
  {
    id: "msg31",
    conversationId: "conv9",
    senderId: "merchant2",
    receiverId: "driver1",
    type: "text",
    content: "Are you available for a new job next week?",
    timestamp: "2025-06-07T20:30:00Z",
    read: false,
    delivered: true,
    status: "delivered",
  },

  // Conversation 10
  {
    id: "msg32",
    conversationId: "conv10",
    senderId: "merchant3",
    receiverId: "driver1",
    type: "text",
    content: "Please provide an update on the delivery status for job #J10.",
    timestamp: "2025-06-07T17:45:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j10",
  },
  {
    id: "msg33",
    conversationId: "conv10",
    senderId: "driver1",
    receiverId: "merchant3",
    type: "text",
    content: "I am currently 15 minutes away from the delivery location.",
    timestamp: "2025-06-07T17:50:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j10",
  },
  {
    id: "msg34",
    conversationId: "conv10",
    senderId: "merchant3",
    receiverId: "driver1",
    type: "text",
    content: "Great! Please make sure to get a signature from the recipient.",
    timestamp: "2025-06-07T17:55:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j10",
  },
  {
    id: "msg35",
    conversationId: "conv10",
    senderId: "driver1",
    receiverId: "merchant3",
    type: "text",
    content: "I have arrived at the delivery location.",
    timestamp: "2025-06-07T18:05:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j10",
  },
  {
    id: "msg36",
    conversationId: "conv10",
    senderId: "driver1",
    receiverId: "merchant3",
    type: "text",
    content:
      "I have completed the delivery and uploaded the proof of delivery.",
    timestamp: "2025-06-07T18:10:00Z",
    read: true,
    delivered: true,
    status: "read",
    jobId: "j10",
  },
];

// Initialize conversations with messages
mockConversations.forEach((conversation) => {
  conversation.messages = mockMessages.filter(
    (message) => message.conversationId === conversation.id
  );
});

// Mock data for calls
const mockCalls: Call[] = [
  {
    id: "call1",
    callerId: "merchant1",
    callerName: "ABC Logistics",
    receiverId: "driver1",
    receiverName: "John Driver",
    status: "completed",
    startTime: "2025-06-06T14:20:00Z",
    endTime: "2025-06-06T14:25:30Z",
    duration: 330, // in seconds
    recorded: true,
    recordingUrl: "https://example.com/recordings/call1.mp3",
    jobId: "j1",
  },
  {
    id: "call2",
    callerId: "driver1",
    callerName: "John Driver",
    receiverId: "merchant2",
    receiverName: "XYZ Shipping",
    status: "missed",
    startTime: "2025-06-04T11:10:00Z",
    recorded: false,
    jobId: "j2",
  },
  {
    id: "call3",
    callerId: "merchant3",
    callerName: "Global Transport",
    receiverId: "driver1",
    receiverName: "John Driver",
    status: "completed",
    startTime: "2025-06-05T09:30:00Z",
    endTime: "2025-06-05T09:35:45Z",
    duration: 345,
    recorded: true,
    recordingUrl: "https://example.com/recordings/call3.mp3",
    jobId: "j3",
  },
  {
    id: "call4",
    callerId: "driver1",
    callerName: "John Driver",
    receiverId: "merchant4",
    receiverName: "Fast Delivery Inc.",
    status: "missed",
    startTime: "2025-06-03T16:45:00Z",
    recorded: false,
    jobId: "j4",
  },
  {
    id: "call5",
    callerId: "m1",
    callerName: "Robert Johnson",
    receiverId: "driver1",
    receiverName: "John Driver",
    status: "completed",
    startTime: "2025-06-07T10:15:00Z",
    endTime: "2025-06-07T10:18:20Z",
    duration: 200,
    recorded: true,
    recordingUrl: "https://example.com/recordings/call5.mp3",
    jobId: "j5",
  },
  {
    id: "call6",
    callerId: "driver1",
    callerName: "John Driver",
    receiverId: "m2",
    receiverName: "Sarah Chen",
    status: "completed",
    startTime: "2025-06-07T13:30:00Z",
    endTime: "2025-06-07T13:32:45Z",
    duration: 165,
    recorded: true,
    recordingUrl: "https://example.com/recordings/call6.mp3",
    jobId: "j6",
  },
  {
    id: "call7",
    callerId: "merchant1",
    callerName: "David Williams",
    receiverId: "driver1",
    receiverName: "John Driver",
    status: "completed",
    startTime: "2025-06-07T09:10:00Z",
    endTime: "2025-06-07T09:15:30Z",
    duration: 330,
    recorded: true,
    recordingUrl: "https://example.com/recordings/call7.mp3",
    jobId: "j8",
  },
  {
    id: "call8",
    callerId: "driver1",
    callerName: "John Driver",
    receiverId: "merchant2",
    receiverName: "Emily Davis",
    status: "failed",
    startTime: "2025-06-07T11:45:00Z",
    endTime: "2025-06-07T11:45:15Z",
    duration: 15,
    recorded: false,
  },
  {
    id: "call9",
    callerId: "merchant3",
    callerName: "Michael Brown",
    receiverId: "driver1",
    receiverName: "John Driver",
    status: "incoming",
    startTime: "2025-06-08T08:30:00Z",
    recorded: true,
    jobId: "j10",
  },
];

// Typing indicators
type TypingIndicator = {
  conversationId: string;
  userId: string;
  userName?: string;
  timestamp: number;
};

// Online user type
type OnlineUser = {
  id: string;
  name: string;
  avatar?: string;
  lastSeen?: string;
  isOnline: boolean;
  email?: string;
};

type ChatState = {
  conversations: Conversation[];
  messages: Message[];
  calls: Call[];
  activeConversationId: string | null;
  activeCall: Call | null;
  typingIndicators: TypingIndicator[];
  archivedConversations: Conversation[];
  onlineUsers: OnlineUser[];

  // Actions
  fetchConversations: (userId: string) => Conversation[];
  fetchMessages: (conversationId: string) => Message[];
  fetchCalls: (userId: string) => Call[];
  fetchArchivedConversations: (userId: string) => Conversation[];
  sendMessage: (conversationId: string, message: Partial<Message>) => void;
  markAsRead: (conversationId: string) => void;
  getConversation: (conversationId: string) => Conversation | undefined;
  initiateCall: (
    callerId: string,
    callerName: string,
    receiverId: string,
    receiverName: string,
    jobId?: string
  ) => Call;
  updateCallStatus: (
    callId: string,
    status: CallStatus,
    endTime?: string,
    duration?: number,
    recordingUrl?: string
  ) => void;
  setActiveConversation: (conversationId: string | null) => void;
  setActiveCall: (call: Call | null) => void;
  getOrCreateConversation: (participantIds: string[], jobId?: string) => string;
  startTyping: (conversationId: string, userId: string, userName?: string) => void;
  stopTyping: (conversationId: string, userId: string) => void;
  isTyping: (conversationId: string, userId: string) => boolean;
  sendImageMessage: (
    conversationId: string,
    senderId: string,
    receiverId: string,
    imageUrl: string,
    jobId?: string
  ) => void;
  sendVoiceMessage: (
    conversationId: string,
    senderId: string,
    receiverId: string,
    audioUrl: string,
    duration: number,
    jobId?: string
  ) => void;
  sendLocationMessage: (
    conversationId: string,
    senderId: string,
    receiverId: string,
    latitude: number,
    longitude: number,
    jobId?: string
  ) => void;
  togglePinConversation: (conversationId: string) => void;
  toggleMuteConversation: (conversationId: string) => void;
  archiveConversation: (conversationId: string) => void;
  unarchiveConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  deleteMessage: (messageId: string) => void;
  searchConversations: (query: string, userId: string) => Conversation[];
  searchMessages: (query: string, conversationId: string) => Message[];
  setOnlineUsers: (users: OnlineUser[]) => void;
  updateOnlineUsers: (users: OnlineUser[]) => void;
  getOnlineUsers: () => OnlineUser[];
  isUserOnline: (userId: string) => boolean;
  getOnlineUser: (userId: string) => OnlineUser | undefined;
  getTypingUsers: (conversationId: string) => TypingIndicator[];
  setTypingUser: (userId: string, conversationId: string, isTyping: boolean, userName?: string) => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [...mockConversations],
  messages: [...mockMessages],
  calls: [...mockCalls],
  activeConversationId: null,
  activeCall: null,
  typingIndicators: [],
  archivedConversations: mockConversations.filter((conv) => conv.archived),
  onlineUsers: [],

  fetchConversations: (userId: string) => {
    // In a real app, this would fetch from an API
    // For now, we're filtering mock data
    return get()
      .conversations.filter(
        (conv) => conv.participants.includes(userId) && !conv.archived
      )
      .sort((a, b) => {
        // First sort by pinned status
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        // Then sort by date
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  },

  fetchMessages: (conversationId: string) => {
    return get()
      .messages.filter((msg) => msg.conversationId === conversationId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  },

  fetchCalls: (userId: string) => {
    return get()
      .calls.filter(
        (call) => call.callerId === userId || call.receiverId === userId
      )
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
  },

  fetchArchivedConversations: (userId: string) => {
    return get()
      .conversations.filter(
        (conv) => conv.participants.includes(userId) && conv.archived
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  getConversation: (conversationId: string) => {
    return get().conversations.find((conv) => conv.id === conversationId);
  },

  sendMessage: (conversationId: string, message: Partial<Message>) => {
    const newMessage: Message = {
      id: message.id || `msg${Date.now()}`,
      conversationId,
      senderId: message.senderId || "",
      receiverId: message.receiverId || "",
      type: message.type || "text",
      content: message.content || "",
      timestamp: message.timestamp || new Date().toISOString(),
      read: message.read || false,
      delivered: message.delivered || true,
      status: message.status || "sent",
      jobId: message.jobId,
      metadata: message.metadata,
    };

    set((state) => {
      // Add message to messages array
      const updatedMessages = [...state.messages, newMessage];

      // Update conversation with new message
      const updatedConversations = state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          // Update messages in the conversation
          const conversationMessages = [...conv.messages, newMessage];

          return {
            ...conv,
            messages: conversationMessages,
            lastMessage: newMessage,
            unreadCount:
              newMessage.senderId !==
                conv.participants.find((id) => id === newMessage.receiverId)
                ? conv.unreadCount + 1
                : conv.unreadCount,
            updatedAt: new Date().toISOString(),
          };
        }
        return conv;
      });

      return {
        messages: updatedMessages,
        conversations: updatedConversations,
      };
    });

    // Simulate message delivery and read status updates
    setTimeout(() => {
      set((state) => {
        const updatedMessages = state.messages.map((msg) =>
          msg.id === newMessage.id
            ? { ...msg, delivered: true, status: "delivered" as MessageStatus }
            : msg
        );

        const updatedConversations = state.conversations.map((conv) => {
          if (
            conv.id === conversationId &&
            conv.lastMessage?.id === newMessage.id
          ) {
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                delivered: true,
                status: "delivered" as MessageStatus,
              },
            };
          }
          return conv;
        });

        return {
          messages: updatedMessages,
          conversations: updatedConversations,
        };
      });
    }, 1000);

    // Simulate a reply after 3 seconds for demo purposes
    if (Math.random() > 0.5) {
      setTimeout(() => {
        const replyContent = [
          "Got it, thanks!",
          "I'll check on that right away.",
          "Perfect, that works for me.",
          "Thanks for the update.",
          "I'll be there soon.",
          "Let me know if anything changes.",
          "The cargo is ready for pickup.",
          "Please drive safely.",
          "Do you need any additional information?",
          "I've updated the delivery instructions.",
        ];

        const randomReply =
          replyContent[Math.floor(Math.random() * replyContent.length)];

        // Start typing indicator
        get().startTyping(conversationId, newMessage.receiverId);

        // Send reply after "typing" delay
        setTimeout(() => {
          get().stopTyping(conversationId, newMessage.receiverId);

          get().sendMessage(conversationId, {
            senderId: newMessage.receiverId,
            receiverId: newMessage.senderId,
            type: "text",
            content: randomReply,
            jobId: newMessage.jobId,
          });
        }, 2000);
      }, 3000);
    }
  },

  markAsRead: (conversationId: string) => {
    set((state) => {
      // Update messages
      const updatedMessages = state.messages.map((msg) =>
        msg.conversationId === conversationId && !msg.read
          ? { ...msg, read: true, status: "read" as MessageStatus }
          : msg
      );

      // Update conversation
      const updatedConversations = state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
            ...conv,
            unreadCount: 0,
            messages: conv.messages.map((msg) =>
              !msg.read
                ? { ...msg, read: true, status: "read" as MessageStatus }
                : msg
            ),
            lastMessage: conv.lastMessage
              ? {
                ...conv.lastMessage,
                read: true,
                status: "read" as MessageStatus,
              }
              : undefined,
          }
          : conv
      );

      return {
        messages: updatedMessages,
        conversations: updatedConversations,
      };
    });
  },

  initiateCall: (
    callerId: string,
    callerName: string,
    receiverId: string,
    receiverName: string,
    jobId?: string
  ) => {
    const newCall: Call = {
      id: `call${Date.now()}`,
      callerId,
      callerName,
      receiverId,
      receiverName,
      status: "outgoing",
      startTime: new Date().toISOString(),
      recorded: true,
      jobId,
    };

    set((state) => ({
      calls: [...state.calls, newCall],
      activeCall: newCall,
    }));

    return newCall;
  },

  updateCallStatus: (
    callId: string,
    status: CallStatus,
    endTime?: string,
    duration?: number,
    recordingUrl?: string
  ) => {
    set((state) => ({
      calls: state.calls.map((call) =>
        call.id === callId
          ? {
            ...call,
            status,
            endTime:
              endTime ||
              (status === "completed" ||
                status === "failed" ||
                status === "missed"
                ? new Date().toISOString()
                : call.endTime),
            duration: duration || call.duration,
            recordingUrl: recordingUrl || call.recordingUrl,
          }
          : call
      ),
      activeCall:
        state.activeCall?.id === callId &&
          (status === "completed" || status === "failed" || status === "missed")
          ? null
          : state.activeCall?.id === callId
            ? {
              ...state.activeCall,
              status,
              endTime:
                endTime ||
                (status === "completed" ||
                  status === "failed" ||
                  status === "missed"
                  ? new Date().toISOString()
                  : state.activeCall.endTime),
              duration: duration || state.activeCall.duration,
              recordingUrl: recordingUrl || state.activeCall.recordingUrl,
            }
            : state.activeCall,
    }));
  },

  setActiveConversation: (conversationId: string | null) => {
    set({ activeConversationId: conversationId });

    // If setting an active conversation, mark messages as read
    if (conversationId) {
      get().markAsRead(conversationId);
    }
  },

  setActiveCall: (call: Call | null) => {
    set({ activeCall: call });
  },

  getOrCreateConversation: (participantIds: string[], jobId?: string) => {
    // Check if conversation already exists
    const existingConv = get().conversations.find((conv) => {
      const participantsMatch =
        participantIds.every((id) => conv.participants.includes(id)) &&
        conv.participants.length === participantIds.length;
      return participantsMatch && (!jobId || conv.jobId === jobId);
    });

    if (existingConv) {
      return existingConv.id;
    }

    // Create new conversation
    const newConvId = `conv${Date.now()}`;
    const newConversation: Conversation = {
      id: newConvId,
      participants: [...participantIds],
      messages: [],
      unreadCount: 0,
      jobId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      conversations: [...state.conversations, newConversation],
    }));

    return newConvId;
  },

  startTyping: (conversationId: string, userId: string, userName?: string) => {
    const now = Date.now();
    console.log("ChatStore - startTyping called with:", { conversationId, userId, userName });

    // Remove any existing typing indicator for this user in this conversation
    set((state) => ({
      typingIndicators: [
        ...state.typingIndicators.filter(
          (indicator) =>
            !(
              indicator.conversationId === conversationId &&
              indicator.userId === userId
            )
        ),
        { conversationId, userId, userName, timestamp: now },
      ],
    }));

    console.log("ChatStore - Updated typingIndicators:", get().typingIndicators);

    // Auto-expire typing indicator after 10 seconds
    setTimeout(() => {
      set((state) => ({
        typingIndicators: state.typingIndicators.filter(
          (indicator) =>
            !(
              indicator.conversationId === conversationId &&
              indicator.userId === userId &&
              indicator.timestamp === now
            )
        ),
      }));
    }, 10000);
  },

  stopTyping: (conversationId: string, userId: string) => {
    set((state) => ({
      typingIndicators: state.typingIndicators.filter(
        (indicator) =>
          !(
            indicator.conversationId === conversationId &&
            indicator.userId === userId
          )
      ),
    }));
  },

  isTyping: (conversationId: string, userId: string) => {
    const typingIndicators = get().typingIndicators;

    // Fix type mismatch by converting both to strings for comparison
    const result = typingIndicators.some(
      (indicator) =>
        String(indicator.conversationId) === String(conversationId) &&
        String(indicator.userId) === String(userId)
    );

    return result;
  },

  setTypingUser: (userId: string, conversationId: string, isTyping: boolean, userName?: string) => {
    if (isTyping) {
      // Check if there's already a typing indicator with a better name
      const existingIndicators = get().typingIndicators;
      const existingIndicator = existingIndicators.find(
        indicator =>
          String(indicator.conversationId) === String(conversationId) &&
          String(indicator.userId) === String(userId)
      );

      // Don't override with "Someone" if we already have a better name
      if (existingIndicator && existingIndicator.userName && existingIndicator.userName !== 'Someone' && userName === 'Someone') {
        console.log('ChatStore - Keeping existing name instead of overriding with "Someone"');
        return;
      }

      get().startTyping(conversationId, userId, userName);
    } else {
      get().stopTyping(conversationId, userId);
    }
  },

  sendImageMessage: (
    conversationId: string,
    senderId: string,
    receiverId: string,
    imageUrl: string,
    jobId?: string
  ) => {
    get().sendMessage(conversationId, {
      senderId,
      receiverId,
      type: "image",
      content: imageUrl,
      jobId,
    });
  },

  sendVoiceMessage: (
    conversationId: string,
    senderId: string,
    receiverId: string,
    audioUrl: string,
    duration: number,
    jobId?: string
  ) => {
    get().sendMessage(conversationId, {
      senderId,
      receiverId,
      type: "voice",
      content: audioUrl,
      jobId,
      metadata: {
        duration,
      },
    });
  },

  sendLocationMessage: (
    conversationId: string,
    senderId: string,
    receiverId: string,
    latitude: number,
    longitude: number,
    jobId?: string
  ) => {
    get().sendMessage(conversationId, {
      senderId,
      receiverId,
      type: "location",
      content: JSON.stringify({ latitude, longitude }),
      jobId,
      metadata: {
        latitude,
        longitude,
      },
    });
  },

  togglePinConversation: (conversationId: string) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, pinned: !conv.pinned } : conv
      ),
    }));
  },

  toggleMuteConversation: (conversationId: string) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, muted: !conv.muted } : conv
      ),
    }));
  },

  archiveConversation: (conversationId: string) => {
    set((state) => {
      const conversationToArchive = state.conversations.find(
        (conv) => conv.id === conversationId && !conv.archived
      );

      return {
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, archived: true } : conv
        ),
        archivedConversations: conversationToArchive
          ? [
            ...state.archivedConversations,
            { ...conversationToArchive, archived: true },
          ]
          : state.archivedConversations,
      };
    });
  },

  unarchiveConversation: (conversationId: string) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, archived: false } : conv
      ),
      archivedConversations: state.archivedConversations.filter(
        (conv) => conv.id !== conversationId
      ),
    }));
  },

  deleteConversation: (conversationId: string) => {
    set((state) => ({
      conversations: state.conversations.filter(
        (conv) => conv.id !== conversationId
      ),
      messages: state.messages.filter(
        (msg) => msg.conversationId !== conversationId
      ),
      archivedConversations: state.archivedConversations.filter(
        (conv) => conv.id !== conversationId
      ),
    }));
  },

  deleteMessage: (messageId: string) => {
    const message = get().messages.find((msg) => msg.id === messageId);

    if (!message) return;

    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    }));

    // If this was the last message in the conversation, update the conversation
    const conversationMessages = get().messages.filter(
      (msg) => msg.conversationId === message.conversationId
    );

    if (conversationMessages.length > 0) {
      // Sort by timestamp to get the latest message
      const latestMessage = [...conversationMessages].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];

      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === message.conversationId
            ? { ...conv, lastMessage: latestMessage }
            : conv
        ),
      }));
    } else {
      // No messages left, remove the lastMessage property
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === message.conversationId
            ? { ...conv, lastMessage: undefined }
            : conv
        ),
      }));
    }
  },

  searchConversations: (query: string, userId: string) => {
    if (!query.trim()) {
      return get().fetchConversations(userId);
    }

    const lowerQuery = query.toLowerCase();

    return get()
      .conversations.filter((conv) => {
        // Check if conversation is for this user and not archived
        if (!conv.participants.includes(userId) || conv.archived) {
          return false;
        }

        // Get the other participant
        const otherParticipantId = conv.participants.find(
          (id) => id !== userId
        );

        // Check if conversation matches query
        return (
          // Check conversation content
          (conv.lastMessage?.content || "")
            .toLowerCase()
            .includes(lowerQuery) ||
          // Check job ID
          (conv.jobId || "").toLowerCase().includes(lowerQuery) ||
          // Check other participant ID
          (otherParticipantId || "").toLowerCase().includes(lowerQuery)
        );
      })
      .sort((a, b) => {
        // First sort by pinned status
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        // Then sort by date
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  },

  searchMessages: (query: string, conversationId: string) => {
    if (!query.trim()) {
      return get().fetchMessages(conversationId);
    }

    const lowerQuery = query.toLowerCase();

    return get()
      .messages.filter(
        (msg) =>
          msg.conversationId === conversationId &&
          // Check message content
          ((msg.type === "text" &&
            msg.content.toLowerCase().includes(lowerQuery)) ||
            // Check message type
            msg.type.toLowerCase().includes(lowerQuery))
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  },

  setOnlineUsers: (users: OnlineUser[]) => {
    set({ onlineUsers: users });
  },

  updateOnlineUsers: (users: OnlineUser[]) => {
    set((state) => {
      // Merge with existing online users, updating existing ones and adding new ones
      const existingUsers = state.onlineUsers;
      const updatedUsers = [...existingUsers];

      users.forEach((newUser) => {
        const existingIndex = updatedUsers.findIndex(user => user.id === newUser.id);
        if (existingIndex !== -1) {
          // Update existing user
          updatedUsers[existingIndex] = { ...updatedUsers[existingIndex], ...newUser };
        } else {
          // Add new user
          updatedUsers.push(newUser);
        }
      });

      return { onlineUsers: updatedUsers };
    });
  },

  getOnlineUsers: () => {
    return get().onlineUsers;
  },

  isUserOnline: (userId: string) => {
    return get().onlineUsers.some(user => user.id === userId && user.isOnline);
  },

  getOnlineUser: (userId: string) => {
    return get().onlineUsers.find(user => user.id === userId);
  },

  getTypingUsers: (conversationId: string) => {
    const typingIndicators = get().typingIndicators;
    console.log("ChatStore - getTypingUsers called for conversationId:", conversationId);
    console.log("ChatStore - All typingIndicators:", typingIndicators);
    const filtered = typingIndicators.filter(
      (indicator) => String(indicator.conversationId) === String(conversationId)
    );
    console.log("ChatStore - Filtered typingUsers:", filtered);
    return filtered;
  },
}));

/**
 * Conversations Service
 * @format
 */

import { httpRequest } from './http-service';
import { endPoints } from './endpoints';

export interface ConversationResponse {
  id: number;
  chatType: string;
  title: string;
  jobId?: number;
  isArchived: boolean;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: number;
  lastMessageId?: number;
  participants: ParticipantResponse[];
  messages: MessageResponse[];
  lastMessage?: {
    id: number;
    content: string;
    messageType: string;
    senderUserId?: number;
    sentAt: string;
  };
}

export interface ParticipantResponse {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  userName: string;
  email: string;
  profileImage?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsApiResponse {
  success: boolean;
  data: ConversationResponse[];
  message?: string;
  status?: string;
}

export interface ConversationApiResponse {
  success: boolean;
  data: ConversationResponse;
  message?: string;
  status?: string;
}

/**
 * Fetch conversations from API
 */
export const fetchConversations = async (includeArchived: boolean = false): Promise<ConversationResponse[]> => {
  try {
    const archivedParam = includeArchived ? 'include' : 'exclude';
    const url = `${endPoints.getConversations}?archived=${archivedParam}`;
    
    console.log('Making API call to:', url);
    console.log('Full URL will be:', `https://api.gofrts.com/api/v1${url}`);
    
    const response: ConversationsApiResponse = await httpRequest.get(url);
    console.log('API response received: for conversations list');
    console.log('Response success:', response);
    console.log('Response data length:', response.data?.length);
    
    // Return the data array from the API response
    return response.data || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data
    });
    throw error;
  }
};

/**
 * Fetch archived conversations from API
 */
export const fetchArchivedConversations = async (): Promise<ConversationResponse[]> => {
  try {
    // Use archived=only to get ONLY archived conversations directly from API
    const url = `${endPoints.getConversations}?archived=only`;
    console.log('Making API call to:', url);
    console.log('Full URL will be:', `https://api.gofrts.com/api/v1${url}`);
    
    const response: ConversationsApiResponse = await httpRequest.get(url);
    console.log('API archived response received');
    console.log('Archived response success:', response.success);
    console.log('Archived response data length:', response.data?.length);
    console.log('Full response data:', JSON.stringify(response.data, null, 2));
    
    // No need to filter since API should return only archived conversations
    const archivedConversations = response.data || [];
    
    console.log('Archived conversations count:', archivedConversations.length);
    console.log('Archived conversations:', JSON.stringify(archivedConversations, null, 2));
    
    return archivedConversations;
  } catch (error) {
    console.error('Error fetching archived conversations:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data
    });
    throw error;
  }
};

/**
 * Fetch all conversations (both archived and non-archived) from API
 */
export const fetchAllConversations = async (): Promise<ConversationResponse[]> => {
  return fetchConversations(true);
};

/**
 * Fetch conversation details by ID (without messages)
 */
export const fetchConversationDetails = async (conversationId: string): Promise<ConversationResponse> => {
  try {
    console.log('Making API call to fetch conversation details:', conversationId);
    console.log('Full URL will be:', `https://api.gofrts.com/api/v1${endPoints.getConversationDetails(conversationId)}`);
    
    // Validate conversationId
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
      throw new Error('Invalid conversation ID provided');
    }
    
    const response: ConversationApiResponse = await httpRequest.get(endPoints.getConversationDetails(conversationId));
    console.log('API response received for conversation details:', conversationId);
    console.log('Response success:', response.success);
    console.log('Response data: conversion details', response.data);
    
    if (!response.success) {
      throw new Error(response.message || 'API returned unsuccessful response');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
      method: error?.config?.method
    });
    
    // Provide more specific error messages
    if (error?.response?.status === 404) {
      throw new Error('Conversation not found');
    } else if (error?.response?.status === 401) {
      throw new Error('Unauthorized - Please check your authentication');
    } else if (error?.response?.status === 403) {
      throw new Error('Forbidden - You do not have access to this conversation');
    } else if (error?.message === 'Invalid conversation ID provided') {
      throw error;
    } else {
      throw new Error(error?.message || 'Failed to fetch conversation details');
    }
  }
};

/**
 * Fetch a specific conversation by ID from API with pagination
 */
export const fetchConversationById = async (conversationId: string, page: number = 1, limit: number = 50): Promise<ConversationResponse> => {
  try {
    console.log('Making API call to fetch conversation:', conversationId, 'page:', page, 'limit:', limit);
    console.log('Endpoint path:', endPoints.getConversation(conversationId, page, limit));
    console.log('Full URL will be:', `https://api.gofrts.com/api/v1${endPoints.getConversation(conversationId, page, limit)}`);
    
    // Validate conversationId
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
      throw new Error('Invalid conversation ID provided');
    }
    
    // Test the endpoint construction
    const endpoint = endPoints.getConversation(conversationId, page, limit);
    console.log('Constructed endpoint:', endpoint);
    console.log('Endpoint type:', typeof endpoint);
    
    const response: ConversationApiResponse = await httpRequest.get(endPoints.getConversation(conversationId, page, limit));
    console.log('API response received for conversation:', conversationId);
    console.log('Response success:', response.success);
    console.log('Response data:', response.data);
    
    if (!response.success) {
      throw new Error(response.message || 'API returned unsuccessful response');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching conversation by ID:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    console.error('Error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
      method: error?.config?.method
    });
    
    // Provide more specific error messages
    if (error?.response?.status === 404) {
      throw new Error('Conversation not found');
    } else if (error?.response?.status === 401) {
      throw new Error('Unauthorized - Please check your authentication');
    } else if (error?.response?.status === 403) {
      throw new Error('Forbidden - You do not have access to this conversation');
    } else if (error?.message === 'Invalid conversation ID provided') {
      throw error;
    } else {
      throw new Error(error?.message || 'Failed to fetch conversation');
    }
  }
};

export interface MessageResponse {
  id: number;
  content: string;
  messageType: string;
  senderUserId?: number | null;
  receiverUserId?: number | null;
  sentAt: string;
  readAt?: string;
  deliveredAt?: string;
  conversationId: number;
  replyToMessageId?: number;
  isSystem?: boolean;
  sender?: any;
  createdAt: string;
  updatedAt: string;
  // File-related fields from API response
  fileUrl?: string;
  fileName?: string;
  fileSize?: string | number;
  fileType?: string;
  metadata?: {
    duration?: number;
    fileName?: string;
    fileSize?: number;
    latitude?: number;
    longitude?: number;
  };
}

export interface MessagesApiResponse {
  success: boolean;
  data: MessageResponse[];
  message?: string;
  status?: string;
}

export interface SendMessageRequest {
  content: string;
  messageType: 'text' | 'image' | 'document' | 'voice' | 'location';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  metadata?: {
    duration?: number;
    fileName?: string;
    fileSize?: number;
    latitude?: number;
    longitude?: number;
  };
}

export interface UploadFileResponse {
  success: boolean;
  data: {
    url: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  };
  message?: string;
}

// New interface for the voice message upload API response
export interface VoiceUploadApiResponse {
  url: string;
  key: string;
  size: number;
  mimetype: string;
}

export interface SendMessageResponse {
  success: boolean;
  data: MessageResponse;
  message?: string;
  status?: string;
}

export interface CreateDirectConversationRequest {
  receiverUserId: number;
}

export interface CreateDirectConversationResponse {
  success: boolean;
  data: ConversationResponse;
  message?: string;
  status?: string;
}

/**
 * Fetch messages for a specific conversation from API
 */
export const fetchMessagesByConversationId = async (conversationId: string): Promise<MessageResponse[]> => {
  try {
    console.log('Making API call to fetch messages for conversation:', conversationId);
    console.log('Full URL will be:', `https://api.gofrts.com/api/v1${endPoints.getMessages(conversationId)}`);
    
    const response: MessagesApiResponse = await httpRequest.get(endPoints.getMessages(conversationId));
    console.log('API response received for messages:', response);
    console.log('Response success:', response.success);
    console.log('Response data length:', response.data?.length);
    
    return response.data || [];
  } catch (error) {
    console.error('Error fetching messages by conversation ID:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data
    });
    throw error;
  }
};

/**
 * Upload a file and get the URL
 */
export const uploadFile = async (fileUri: string, fileName: string, fileType: string): Promise<UploadFileResponse> => {
  try {
    console.log('Uploading file:', fileName, fileType);
    console.log('File URI:', fileUri);
    console.log('File type:', fileType);
    
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: fileType,
      name: fileName,
    } as any);
    
    console.log('FormData created, sending request to:', endPoints.uploadFile);
    
    const response: UploadFileResponse = await httpRequest.post(
      endPoints.uploadFile,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('File uploaded successfully:', response);
    console.log('Response success:', response.success);
    console.log('Response data:', response.data);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to upload file');
    }
    
    return response;
  } catch (error) {
    console.error('Error uploading file:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

/**
 * Upload a voice message file and get the URL
 * Uses the httpRequest instance for proper authentication and error handling
 */
export const uploadVoiceMessage = async (fileUri: string, fileName: string): Promise<VoiceUploadApiResponse> => {
  try {
    console.log("📤 API Call - Starting voice message upload");
    console.log("📤 API Call - Upload parameters:", {
      fileName,
      fileUri,
      endpoint: '/upload'
    });
    
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'audio/mpeg', // Default to audio/mpeg for voice messages
      name: fileName,
    } as any);
    
    console.log("📤 API Call - FormData created with file details:", {
      fileName,
      type: 'audio/mpeg',
      uri: fileUri
    });
    
    // Use httpRequest for proper authentication and error handling
    const response = await httpRequest.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log("📤 API Call - Upload response received:", response);
    
    // The response should already be parsed by httpRequest interceptors
    // Extract the actual data from the axios response
    const result: VoiceUploadApiResponse = response.data || response;
    
    console.log("📤 API Call - Voice message uploaded successfully:", {
      url: result.url,
      key: result.key,
      size: result.size,
      mimetype: result.mimetype
    });
    
    return result;
  } catch (error) {
    console.error("📤 API Call - Error uploading voice message:", error);
    console.error("📤 API Call - Upload error details:", {
      message: error?.message,
      stack: error?.stack,
      fileName,
      fileUri
    });
    throw error;
  }
};

/**
 * Send a voice message to a conversation
 */
export const sendVoiceMessage = async (
  conversationId: string,
  voiceFileUri: string,
  fileName: string,
  duration?: number
): Promise<MessageResponse> => {
  try {
    console.log("📤 API Call - Starting voice message send process");
    console.log("📤 API Call - Send voice message parameters:", {
      conversationId,
      voiceFileUri,
      fileName,
      duration
    });
    
    // First upload the voice file
    console.log("📤 API Call - Step 1: Uploading voice file");
    const uploadResult = await uploadVoiceMessage(voiceFileUri, fileName);
    
    console.log("📤 API Call - Step 1 completed: Voice file uploaded");
    console.log("📤 API Call - Upload result:", uploadResult);
    
    // Then send the message with the uploaded file URL
    console.log("📤 API Call - Step 2: Preparing message data");
    const messageData: SendMessageRequest = {
      content: fileName || 'Voice message', // Use filename or default content
      messageType: 'voice',
      fileUrl: uploadResult.url,
      fileName: uploadResult.key || fileName,
      fileSize: uploadResult.size,
    };
    
    // Add duration to metadata if provided
    if (duration && duration > 0) {
      messageData.metadata = {
        duration: Math.round(duration), // Ensure duration is a whole number
        fileName: uploadResult.key || fileName,
        fileSize: uploadResult.size,
      };
      console.log("📤 API Call - Added metadata with duration:", Math.round(duration));
    }
    
    console.log("📤 API Call - Final message data structure:", JSON.stringify(messageData, null, 2));
    
    console.log("📤 API Call - Step 2: Sending message to conversation");
    const response = await sendMessageToConversation(conversationId, messageData);
    
    console.log("📤 API Call - Voice message sent successfully");
    console.log("📤 API Call - Final response:", {
      id: response.id,
      messageType: response.messageType,
      fileUrl: response.fileUrl,
      fileName: response.fileName,
      metadata: response.metadata,
      conversationId: response.conversationId,
      sentAt: response.sentAt
    });
    
    return response;
  } catch (error) {
    console.error("📤 API Call - Error in voice message send process:", error);
    console.error("📤 API Call - Send voice message error details:", {
      message: error?.message,
      stack: error?.stack,
      conversationId,
      voiceFileUri,
      fileName,
      duration
    });
    throw error;
  }
};

/**
 * Create a direct conversation with another user
 */
export const createDirectConversation = async (
  receiverUserId: number
): Promise<ConversationResponse> => {
  try {
    console.log('Making API call to create direct conversation with user:', receiverUserId);
    console.log('Full URL will be:', `https://api.gofrts.com/api/v1${endPoints.createDirectConversation}`);
    
    const requestData: CreateDirectConversationRequest = {
      receiverUserId
    };
    
    const response: CreateDirectConversationResponse = await httpRequest.post(
      endPoints.createDirectConversation,
      requestData
    );
    
    console.log('API response received for create direct conversation:', receiverUserId);
    console.log('Response success:', response.success);
    console.log('Response data:', response.data);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create direct conversation');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error creating direct conversation:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data
    });
    throw error;
  }
};

/**
 * Archive a conversation
 */
export const archiveConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const url = `/conversations/${conversationId}/archive`;
    console.log('Making API call to archive conversation:', conversationId);
    console.log('Full URL will be:', `https://api.gofrts.com/api/v1${url}`);
    
    const response = await httpRequest.patch(url);
    console.log('API response received for archive conversation:', conversationId);
    console.log('Response:', response);
    
    return true;
  } catch (error) {
    console.error('Error archiving conversation:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data
    });
    throw error;
  }
};

/**
 * Unarchive a conversation
 */
export const unarchiveConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const url = `/conversations/${conversationId}/unarchive`;
    console.log('Making API call to unarchive conversation:', conversationId);
    console.log('Full URL will be:', `https://api.gofrts.com/api/v1${url}`);
    
    const response = await httpRequest.patch(url);
    console.log('API response received for unarchive conversation:', conversationId);
    console.log('Response:', response);
    
    return true;
  } catch (error) {
    console.error('Error unarchiving conversation:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data
    });
    throw error;
  }
};

/**
 * Send a message to a conversation
 */
export const sendMessageToConversation = async (
  conversationId: string, 
  messageData: SendMessageRequest
): Promise<MessageResponse> => {
  try {
    console.log('Making API call to send message to conversation:', conversationId);
    console.log('Message data being sent:', JSON.stringify(messageData, null, 2));
    console.log('Full URL will be:', `https://api.gofrts.com/api/v1/conversations/${conversationId}/messages`);
    
    const response: SendMessageResponse = await httpRequest.post(
      endPoints.getMessages(conversationId), 
      messageData
    );
    
    console.log('API response received for send message: payload', messageData);
    console.log('Response success:', response.success);
    console.log('Response data:', response.data);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to send message');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error sending message to conversation:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      errors: error?.errors || error?.response?.data?.errors,
      validationErrors: error?.response?.data?.errors
    });
    
    // Log the exact request that failed
    console.error('Failed request details:', {
      url: `https://api.gofrts.com/api/v1/conversations/${conversationId}/messages`,
      method: 'POST',
      payload: JSON.stringify(messageData, null, 2)
    });
    
    throw error;
  }
};

/**
 * Chat Screen
 * @format
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Modal,
  Alert,
  Animated,
  PermissionsAndroid,
  Linking,
  SafeAreaView,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  ArrowLeft,
  Send,
  Phone,
  MoreVertical,
  Paperclip,
  Mic,
  Image as ImageIcon,
  MapPin,
  Pause,
  Play,
  File,
  X,
  Check,
  CheckCheck,
  Clock,
  Camera,
  Download,
} from "lucide-react-native";
import { useSelector, useDispatch } from "react-redux";
import { WebView } from "react-native-webview";
import RNFS from "react-native-fs";
import Sound, { AudioSet, AudioEncoderAndroidType, AudioSourceAndroidType, AVEncoderAudioQualityIOSType } from "react-native-nitro-sound";

import { Colors, useThemedStyle } from "@app/styles";
import { useChatStore } from "@app/store/chatStore";
import { useCallStore } from "@app/store/callStore";
import { webrtcService } from "@app/service/webrtc-service";
import { dismissLoader, presentLoader, selectProfile } from "@app/module/common";
// Removed mockMerchants import - merchant role not used in system
import { Message, MessageStatus, Conversation } from "@app/types";
import { getStyles } from "./styles";
import { useTranslation } from "react-i18next";
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from "react-native-image-picker";

import { pick, types } from "@react-native-documents/picker";

import {
  fetchConversationById,
  fetchAllConversations,
  sendMessageToConversation,
  ConversationResponse,
  MessageResponse,
  SendMessageRequest,
  UploadFileResponse,
  uploadVoiceMessage,
  sendVoiceMessage,
} from "@app/service/conversations-service";
import { createLoader, uploadFile, uploadVoiceMessage as uploadVoiceMessageAction, sendVoiceMessage as sendVoiceMessageAction } from "../../common";
import { showMessage } from "react-native-flash-message";
import FullScreenDocumentViewer from "@app/components/DocumentViewerModal";
import { AudioPlayer } from "@app/components/audioPlayer";
import { MessageSkeleton } from "@app/components/SkeletonLoader";
// import AudioPlayer from "@app/components/audioPlayer";

type RootStackParamList = {
  CallScreen: { userId: string };
  ChatScreen: {
    conversationId: string;
    selectedParticipant?: {
      id: string;
      userName: string;
      firstName?: string;
      lastName?: string;
      profileImage?: string;
      phoneNumber?: string;
      phoneCountryCode?: string;
      role?: string;
      isOnline?: boolean;
      lastSeen?: string;
    };
  };
  GroupDetailsScreen: {
    conversation: Conversation;
    participants: Array<{
      id: string;
      userName: string;
      firstName?: string;
      lastName?: string;
      profileImage?: string;
      isOnline?: boolean;
      lastSeen?: string;
    }>;
  };
};
type ChatScreenRouteProp = RouteProp<RootStackParamList, "ChatScreen">;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const downloadFile = async (fileUrl: string) => {
  console.log("Chat screen - Downloading file:eeee", fileUrl);
  try {
    const fileName = fileUrl.split("/").pop(); // extract file name from url
    const localPath = `${RNFS.DownloadDirectoryPath}/${fileName}`; // save to Downloads folder (Android)

    const options = {
      fromUrl: fileUrl,
      toFile: localPath,
    };

    const result = await RNFS.downloadFile(options).promise;
    const { t: translate } = useTranslation();

    if (result.statusCode === 200) {
      Alert.alert(translate("common.success"), `${translate("common.fileDownloadedSuccess")}: ${localPath}`);
      console.log("File saved at:", localPath);
    } else {
      Alert.alert(translate("common.error"), translate("common.failedToDownloadFile"));
    }
  } catch (err) {
    console.error("Download error:", err);
    const { t: translate } = useTranslation();
    Alert.alert(translate("common.error"), translate("common.somethingWentWrongDownload"));
  }
};
function ChatScreen() {
  let t;
  try {
    const translation = useTranslation();
    t = translation.t;
  } catch (error) {
    console.error('Translation initialization error:', error);
    // Fallback function that returns the key if translation fails
    t = (key: string) => key;
  }

  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const route = useRoute<ChatScreenRouteProp>();

  console.log("Chat screen - Full route object:", route);
  console.log("Chat screen - route.params:", route?.params);
  console.log("Chat screen - route.params type:", typeof route?.params);
  const [loading, setLoading] = useState(true);

  const { participantsinConv, conversationId: routeConversationId, selectedParticipant, conversationItem } =
    route?.params || {};
  console.log("Chat screen - route?.params:", participantsinConv);
  // Try to get conversation ID from multiple sources
  const conversationId = (() => {
    console.log("🔍 Debugging conversationId sources:", {
      routeConversationId,
      conversationItem: !!conversationItem,
      conversationItemId: conversationItem?.id,
      conversationItemApiData: conversationItem?.apiData,
    });

    // First try route params
    if (routeConversationId && routeConversationId !== "0" && routeConversationId !== "undefined") {
      console.log("✅ Using conversationId from route params:", routeConversationId);
      return routeConversationId;
    }

    // Try conversationItem.id
    if (conversationItem?.id && conversationItem.id !== "0") {
      console.log("✅ Using conversationId from conversationItem.id:", conversationItem.id);
      return conversationItem.id.toString();
    }

    // Try conversationItem.apiData.id
    if (conversationItem?.apiData?.id && conversationItem.apiData.id !== "0") {
      console.log("✅ Using conversationId from conversationItem.apiData.id:", conversationItem.apiData.id);
      return conversationItem.apiData.id.toString();
    }

    console.log("❌ Could not find valid conversationId");
    return routeConversationId || "0";
  })();

  console.log("Chat screen - Final conversationId:", conversationId);
  console.log("Chat screen - conversationId type:", typeof conversationId);
  console.log("Chat screen - selectedParticipant:", selectedParticipant);
  console.log("Chat screen - conversationId length:", conversationId?.length);
  console.log(
    "Chat screen - conversationId is undefined:",
    conversationId === undefined
  );
  console.log("Chat screen - conversationId is null:", conversationId === null);
  console.log("Chat screen - Full route params:", route?.params);
  console.log("Chat screen - Route params keys:", Object.keys(route?.params || {}));
  const userProfile = useSelector(selectProfile);
  const dispatch = useDispatch();
  console.log("Chat screen - userProfile:", userProfile);
  const {
    getConversation,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    isTyping,
    getTypingUsers,
    onlineUsers,
    getOnlineUsers,
    isUserOnline,
    getOnlineUser,
  } = useChatStore();

  const [conversation, setConversation] = useState<Conversation | undefined>(
    undefined
  );
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(
    null
  );
  const [apiConversation, setApiConversation] =
    useState<ConversationResponse | null>(null);
  const [socketMessages, setSocketMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [allApiMessages, setAllApiMessages] = useState<MessageResponse[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageText, setImageText] = useState("");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);

  console.log("Chat screen - conversation state:", conversation);

  // Function to add socket message to the list
  const addSocketMessage = (message: Message) => {
    console.log("Chat screen - Adding socket message:", message);
    setSocketMessages((prev) => {
      // Check if message already exists to prevent duplicates
      const exists = prev.some((msg) => msg.id === message.id);
      if (exists) {
        console.log(
          "Chat screen - Message already exists, skipping:",
          message.id
        );
        return prev;
      }
      console.log('addSocketMessage', ...prev, message);
      return [...prev, message];
    });

    // Auto-scroll to bottom when new message is added
    if (shouldAutoScroll) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Handle scroll events to detect if user is at bottom
  const handleScroll = (event: any) => {
    // alert('handleScroll');
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    setIsUserAtBottom(isAtBottom);

    // If user scrolls to bottom, enable auto-scroll
    if (isAtBottom) {
      setShouldAutoScroll(true);
    }
  };

  // Handle scroll to bottom when user manually scrolls to bottom
  const scrollToBottom = () => {
    setShouldAutoScroll(true);
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  // Handle call button press
  const handleCallPress = async () => {
    try {
      if (!conversationId || conversationId === "0") {
        Alert.alert(t("common.error"), t("common.invalidConversationId"));
        return;
      }

      if (!userProfile?.id) {
        Alert.alert(t("common.error"), t("common.userNotLoggedIn"));
        return;
      }

      console.log('📞 Chat: Starting call for conversation:', conversationId);

      // Clean up any existing call state
      const { endCall, currentCall } = useCallStore.getState();
      if (currentCall?.callId) {
        await endCall(currentCall.callId);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Start the call via backend API
      const result = await webrtcService.initiateCall(Number(conversationId), 'audio', true);

      console.log('✅ Chat: Call initiated successfully:', result);

      // Navigate to call screen
      (navigation as any).navigate('CallScreen', {
        callId: result.data.id.toString(),
        receiverId: conversationId,
        callType: 'audio',
        isBackendCall: true,
        conversationId: Number(conversationId)
      });

    } catch (error) {
      console.error('❌ Chat: Failed to start call:', error);
      Alert.alert(t("common.callError"), `${t("common.failedToStartCall")}: ${error.message}`);
    }
  };

  // Get the other participant's online status
  // Get the other participant's online status - memoized to prevent flickering
  const getOtherParticipantStatus = useMemo(() => {
    if (!selectedParticipant?.id) return null;

    const onlineUser = getOnlineUser(selectedParticipant.id);
    const isOnline = onlineUser?.isOnline || false;

    return {
      isOnline,
      lastSeen: onlineUser?.lastSeen,
      name:
        onlineUser?.name ||
        selectedParticipant.userName ||
        selectedParticipant.firstName ||
        "User",
      avatar: onlineUser?.avatar || selectedParticipant.profileImage,
      email: onlineUser?.email,
    };
  }, [selectedParticipant?.id, selectedParticipant?.userName, selectedParticipant?.firstName, selectedParticipant?.profileImage, getOnlineUser]);

  // Function to get all messages (API + Socket)
  const getAllMessages = () => {
    // Use accumulated API messages as base
    const allMessages = [...allApiMessages];

    // Add socket messages that are not already in API messages
    socketMessages.forEach((socketMsg) => {
      const existsInApi = allApiMessages.some(
        (apiMsg) => apiMsg.id.toString() === socketMsg.id.toString()
      );
      if (!existsInApi) {
        allMessages.push(socketMsg);
      }
    });

    // Sort by timestamp in DESCENDING order (newest first) for inverted FlatList
    return allMessages.sort((a, b) => {
      // Handle both Message and MessageResponse types
      const timestampA = new Date((a as any).timestamp || (a as any).sentAt || 0).getTime();
      const timestampB = new Date((b as any).timestamp || (b as any).sentAt || 0).getTime();
      return timestampB - timestampA; // Descending order (newest first)
    });
  };
  const fetchConversationData = async (
    page: number = 1,
    isLoadMore: boolean = false
  ) => {
    console.log("Chat screen - fetchConversationData called with:", {
      conversationId,
      userProfile: !!userProfile,
      page,
      isLoadMore,
    });

    if (!conversationId || !userProfile) {
      console.log("Chat screen - Missing conversationId or userProfile:", {
        conversationId,
        userProfile: !!userProfile,
      });
      return;
    }

    if (
      conversationId === "undefined" ||
      conversationId === "null" ||
      conversationId === ""
    ) {
      console.log("Chat screen - Invalid conversationId:", conversationId);
      setConversationError("Invalid conversation ID");
      return;
    }

    console.log(
      "Chat screen - Starting API fetch for conversation:",
      conversationId,
      "page:",
      page
    );

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingConversation(true);
      setConversationError(null);
    }

    try {
      console.log(
        "Chat screen - Fetching conversation from API:",
        conversationId,
        "page:",
        page
      );
      console.log("Chat screen - About to call fetchConversationById...");

      let conversationData: ConversationResponse;

      try {
        // Try to fetch conversation details directly with pagination
        conversationData = await fetchConversationById(
          conversationId,
          page,
          50
        );
        console.log(
          "Chat screen - fetchConversationById completed, data:",
          conversationData
        );
      } catch (directError) {
        console.log(
          "Chat screen - Direct fetch failed, trying fallback method:",
          directError
        );

        // Fallback: fetch all conversations and find the one we need
        console.log("Chat screen - Fetching all conversations as fallback...");
        const allConversations = await fetchAllConversations();
        console.log(
          "Chat screen - All conversations fetched:",
          allConversations
        );

        const foundConversation = allConversations.find(
          (conv) => conv.id.toString() === conversationId
        );
        if (foundConversation) {
          console.log(
            "Chat screen - Found conversation in list:",
            foundConversation
          );
          conversationData = foundConversation;
        } else {
          throw new Error(
            `Conversation with ID ${conversationId} not found in conversations list`
          );
        }
      }

      console.log(
        "Chat screen - conversationData.participants:",
        conversationData.participants
      );
      console.log(
        "Chat screen - conversationData.participants length:",
        conversationData.participants?.length
      );
      console.log(
        "Chat screen - conversationData type:",
        typeof conversationData
      );
      console.log("Chat screen - conversationData.id:", conversationData.id);
      console.log(
        "Chat screen - conversationData.id type:",
        typeof conversationData.id
      );
      console.log(
        "Chat screen - Full conversationData structure:",
        JSON.stringify(conversationData, null, 2)
      );

      if (!isLoadMore) {
        setApiConversation(conversationData);
      }

      // Get messages from the conversation data (API includes messages in the response)
      const messagesData: MessageResponse[] = conversationData.messages || [];
      console.log(
        "Chat screen - Messages from conversation data:",
        messagesData
      );

      console.log("Chat screen - API data fetched successfully");
      console.log("Messages data:", messagesData);

      // Handle pagination
      if (isLoadMore) {
        // Load more - prepend older messages
        setAllApiMessages((prev) => [...prev, ...messagesData,]);
        setCurrentPage(page);
        setHasMoreMessages(messagesData.length === 50);
      } else {
        // First load - set initial messages
        setAllApiMessages(messagesData);
        setCurrentPage(1);
        setHasMoreMessages(messagesData.length === 50);
      }

      // Convert API data to local conversation format (only on first load)
      if (!isLoadMore) {
        let convertedMessages: Message[] = [];
        let convertedConversation: Conversation;

        try {
          console.log("Chat screen - Converting messages data...");
          convertedMessages = messagesData.map((msg: MessageResponse) => {
            console.log("Chat screen - Converting message:", msg);
            const senderId = msg.senderUserId ? msg.senderUserId.toString() : "system";
            console.log("🔍 Message Conversion Debug:", {
              originalSenderUserId: msg.senderUserId,
              convertedSenderId: senderId,
              content: msg.content
            });
            return {
              id: (msg.id || 0).toString(),
              conversationId: (msg.conversationId || 0).toString(),
              senderId: senderId,
              receiverId: (msg.receiverUserId || "all").toString(),
              type: msg.messageType as any,
              content: msg.content || "",
              timestamp: msg.sentAt || new Date().toISOString(),
              read: !!msg.readAt,
              delivered: !!msg.deliveredAt,
              status: (() => {
                if (msg.readAt) return "read";
                if (msg.deliveredAt) return "delivered";
                return "sent";
              })(),
              metadata: {
                ...msg.metadata,
                fileUrl: msg.fileUrl, // Include fileUrl from API response
                fileName: msg.fileName,
                fileSize: msg.fileSize,
                fileType: msg.fileType,
              },
            };
          });

          console.log("Chat screen - Converting conversation data...");
          convertedConversation = {
            id: (conversationData.id || 0).toString(),
            participants:
              conversationData.participants?.map((p) =>
                (p.id || 0).toString()
              ) || [],
            messages: convertedMessages,
            lastMessage:
              convertedMessages.length > 0
                ? convertedMessages[convertedMessages.length - 1]
                : undefined,
            unreadCount: 0, // This would need to be calculated based on read status
            createdAt: conversationData.createdAt || new Date().toISOString(),
            updatedAt:
              conversationData.updatedAt ||
              conversationData.lastMessageAt ||
              new Date().toISOString(),
            jobId: conversationData.jobId?.toString(),
          };

          console.log("Chat screen - Data conversion successful");
        } catch (conversionError) {
          console.error(
            "Chat screen - Error converting data:",
            conversionError
          );
          throw new Error(`Data conversion failed: ${conversionError.message}`);
        }

        setConversation(convertedConversation);
        console.log(
          "Chat screen - Conversation set successfully:",
          convertedConversation
        );
      }
    } catch (error) {
      console.error("Chat screen - Error fetching conversation data:", error);

      // Check if it's a 404 error (conversation not found)
      if (
        error?.message?.includes("not found") ||
        error?.response?.status === 404
      ) {
        setConversationError(
          "Conversation not found. The conversation may have been deleted or you may not have access to it."
        );
      } else if (error?.message?.includes("Invalid conversation ID")) {
        setConversationError(
          "Invalid conversation ID. Please check the conversation link."
        );
      } else {
        setConversationError(
          error?.message || "Failed to load conversation. Please try again."
        );
      }

      // Fallback to basic conversation if API fails
      const basicConversation: Conversation = {
        id: conversationId,
        participants: [userProfile.id.toString()],
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        lastMessage: undefined,
      };

      // Create a mock API conversation for display
      const mockApiConversation: ConversationResponse = {
        id: parseInt(conversationId) || 0,
        chatType: "direct",
        title: `Conversation ${conversationId}`,
        isArchived: false,
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        participants: [
          {
            id: userProfile.id,
            firstName: userProfile.firstName || "",
            middleName: "",
            lastName: userProfile.lastName || "",
            userName: userProfile.userName || "user",
            email: userProfile.email || "",
            profileImage: userProfile.profileImage,
            phoneCountryCode: userProfile.phoneCountryCode,
            phoneNumber: userProfile.phoneNumber,
            verificationStatus: "verified",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        messages: [],
        lastMessage: undefined,
      };

      setApiConversation(mockApiConversation);
      setConversation(basicConversation);
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoadingConversation(false);
      }
    }
  };
  // Fetch conversation and messages from API
  useEffect(() => {
    console.log("Chat screen - useEffect triggered with:", {
      conversationId,
      userProfile: !!userProfile,
    });

    fetchConversationData();
  }, [conversationId, userProfile]);

  console.log("Chat screen - useEffect dependency check:", {
    conversationId,
    userProfile: !!userProfile,
  });



  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingPath, setRecordingPath] = useState<string>("");
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const audioRecorderPlayer = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    audioRecorderPlayer.current = Sound;

    return () => {
      // Cleanup typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  const [showAttachments, setShowAttachments] = useState(false);
  const [googleDocsUrl, setGoogleDocsUrl] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Get the other participant
  const otherParticipantId = (() => {
    console.log('🔍 Debugging otherParticipantId:', {
      conversation: !!conversation,
      participants: conversation?.participants,
      userProfileId: userProfile?.id,
      apiConversation: !!apiConversation,
      apiParticipants: apiConversation?.participants,
      selectedParticipant: selectedParticipant,
    });

    // First try selectedParticipant from route params
    if (selectedParticipant?.id) {
      console.log('✅ Using otherParticipantId from selectedParticipant:', selectedParticipant.id);
      return selectedParticipant.id.toString();
    }

    // Try to get from conversation participants first
    if (Array.isArray(conversation?.participants) && conversation.participants.length > 0) {
      const found = conversation.participants.find(
        (participantId: string) =>
          participantId !== (userProfile?.id || 0).toString()
      );
      if (found) {
        console.log('✅ Found otherParticipantId from conversation:', found);
        return found;
      }
    }
    console.log("Chat screen - apiConversation:", ConversationResponse);
    // Try to get from API conversation participants
    if (Array.isArray(apiConversation?.participants) && apiConversation.participants.length > 0) {
      const found = apiConversation.participants.find(
        (participant: any) => {
          const participantId = (participant.id || participant.userId || 0).toString();
          return participantId !== (userProfile?.id || 0).toString();
        }
      );
      if (found) {
        const participantId = (found.id || found.userId || 0).toString();
        console.log('✅ Found otherParticipantId from API conversation:', participantId);
        return participantId;
      }
    }

    // Try to get from conversationItem
    if (conversationItem?.participants && Array.isArray(conversationItem.participants)) {
      const found = conversationItem.participants.find(
        (participantId: string) =>
          participantId !== (userProfile?.id || 0).toString()
      );
      if (found) {
        console.log('✅ Found otherParticipantId from conversationItem:', found);
        return found;
      }
    }

    // Try to get from conversationItem.apiData
    if (conversationItem?.apiData?.participants && Array.isArray(conversationItem.apiData.participants)) {
      const found = conversationItem.apiData.participants.find(
        (participant: any) => {
          const participantId = (participant.id || participant.userId || 0).toString();
          return participantId !== (userProfile?.id || 0).toString();
        }
      );
      if (found) {
        const participantId = (found.id || found.userId || 0).toString();
        console.log('✅ Found otherParticipantId from conversationItem.apiData:', participantId);
        return participantId;
      }
    }

    console.log('❌ Could not find otherParticipantId from any source');
    return undefined;
  })();

  // Get participant info from API data or fallback to mock data
  const otherParticipant = apiConversation?.participants?.find(
    (p) => (p.id || 0).toString() === otherParticipantId
  );

  // Removed merchant logic - merchant role not used in system

  useEffect(() => {
    if (conversation && conversation.unreadCount > 0) {
      markAsRead(conversation.id);
    }

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        if (shouldAutoScroll) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 300); // Increased delay to work with KeyboardAvoidingView
        }
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        // Keyboard hidden - no action needed
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [conversation]);

  useEffect(() => {
    // Update conversation when it changes
    if (conversationId) {
      console.log(
        "Chat screen - useEffect: Getting conversation for ID:",
        conversationId
      );
      const updatedConversation = getConversation(conversationId);
      console.log(
        "Chat screen - useEffect: Retrieved conversation:",
        updatedConversation
      );
      if (updatedConversation) {
        setConversation(updatedConversation);
        console.log("Chat screen - useEffect: Set conversation state");
      } else {
        console.log(
          "Chat screen - useEffect: No conversation found for ID:",
          conversationId
        );
      }
    }
  }, [conversationId, getConversation]);

  // No need for store updates since we're using API messages as base

  // Join conversation room and listen for socket messages
  useEffect(() => {
    if (!conversationId) return;

    // Import socket service and join conversation room
    import("@app/service/socket-service").then(({ socketService }) => {
      if (socketService.isSocketConnected()) {
        console.log("Chat screen - Joining conversation room:", conversationId);
        socketService.joinConversationRoom(conversationId);

        // Listen for new messages
        const handleNewMessage = (messageData: any) => {
          console.log("Chat screen - Received socket message:", messageData);

          // Check if this message is from the current user (to avoid duplicates)
          const messageSenderId =
            messageData.senderId ||
            messageData.sender_id ||
            messageData.senderUserId ||
            "";
          const isFromCurrentUser =
            String(messageSenderId) === String(userProfile?.id);

          if (isFromCurrentUser) {
            console.log(
              "Chat screen - Ignoring message from current user (already sent):",
              messageData
            );
            return;
          }

          // Convert socket message to Message format
          const socketMessage: Message = {
            id: messageData.id || messageData._id || `socket_${Date.now()}`,
            conversationId:
              messageData.conversationId ||
              messageData.conversation_id ||
              conversationId,
            senderId: messageSenderId,
            receiverId:
              messageData.receiverId ||
              messageData.receiver_id ||
              messageData.receiverUserId ||
              "all",
            type: messageData.messageType || messageData.type || "text",
            content: messageData.content || "",
            timestamp:
              messageData.sentAt ||
              messageData.timestamp ||
              messageData.createdAt ||
              new Date().toISOString(),
            read: false,
            delivered: true,
            status: "delivered",
            jobId: messageData.jobId || messageData.job_id,
            metadata: {
              ...messageData.metadata,
              fileUrl: messageData.fileUrl,
              fileName: messageData.fileName,
              fileSize: messageData.fileSize,
              fileType: messageData.fileType,
            },
          };

          // Add to socket messages
          addSocketMessage(socketMessage);
        };

        // Add event listener
        socketService.socket?.on("new_message", handleNewMessage);

        // Listen for typing events
        socketService.socket?.on("user_typing_start", (data: any) => {
          console.log('💬 Chat component - user_typing_start event received:', data);
          handleTypingStart(data);
        });

        socketService.socket?.on("user_typing_stop", (data: any) => {
          console.log('💬 Chat component - user_typing_stop event received:', data);
          handleTypingStop(data);
        });

        return () => {
          // Remove event listeners
          socketService.socket?.off("new_message", handleNewMessage);
          socketService.socket?.off("user_typing_start", handleTypingStart);
          socketService.socket?.off("user_typing_stop", handleTypingStop);
        };
      }
    });

    return () => {
      // Leave conversation room when component unmounts
      import("@app/service/socket-service").then(({ socketService }) => {
        if (socketService.isSocketConnected()) {
          console.log(
            "Chat screen - Leaving conversation room:",
            conversationId
          );
          socketService.leaveConversationRoom(conversationId);
        }
      });
    };
  }, [conversationId]);

  const handleSend = async () => {
    if (!message.trim() || !userProfile || !conversation || !conversationId)
      return;

    const messageContent = message.trim();
    setMessage("");
    setShowAttachments(false);

    // Create temporary message for immediate display
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      conversationId: conversationId,
      senderId: userProfile.id.toString(),
      receiverId: otherParticipantId || "all",
      type: "text",
      content: messageContent,
      timestamp: new Date().toISOString(),
      read: false,
      delivered: false,
      status: "sending",
    };

    // Add to socket messages for immediate display
    addSocketMessage(tempMessage);

    try {
      console.log("Chat screen - Sending message via API:", messageContent);

      // Send message via API
      const messageData: SendMessageRequest = {
        content: messageContent,
        messageType: "text",
      };

      const apiResponse = await sendMessageToConversation(
        conversationId,
        messageData
      );
      console.log("Chat screen - Message sent successfully:", apiResponse);

      // Convert API response to local message format
      const newMessage: Message = {
        id: apiResponse.id.toString(),
        conversationId: apiResponse.conversationId.toString(),
        senderId: (apiResponse.senderUserId || userProfile.id).toString(),
        receiverId: (apiResponse.receiverUserId || "all").toString(),
        type: apiResponse.messageType as any,
        content: apiResponse.content,
        timestamp: apiResponse.sentAt,
        read: !!apiResponse.readAt,
        delivered: !!apiResponse.deliveredAt,
        status: (() => {
          if (apiResponse.readAt) return "read";
          if (apiResponse.deliveredAt) return "delivered";
          return "sent";
        })(),
        metadata: apiResponse.metadata,
      };

      // Replace temporary message with real message
      setSocketMessages((prev) =>
        prev.map((msg) => (msg.id === tempMessage.id ? newMessage : msg))
      );

      // Emit message via socket for real-time delivery
      import("@app/service/socket-service").then(({ socketService }) => {
        if (socketService.isSocketConnected()) {
          socketService.emitNewMessage({
            conversationId: conversationId,
            content: messageContent,
            messageType: "text",
            senderId: userProfile.id,
            receiverId: otherParticipantId || "all",
            timestamp: new Date().toISOString(),
          });
        }
      });
    } catch (error) {
      console.error("Chat screen - Error sending message:", error);

      // Update temporary message status to failed
      setSocketMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? { ...msg, status: "failed" } : msg
        )
      );

      // Emit message via socket for real-time delivery (fallback)
      import("@app/service/socket-service").then(({ socketService }) => {
        if (socketService.isSocketConnected()) {
          socketService.emitNewMessage({
            conversationId: conversationId,
            content: messageContent,
            messageType: "text",
            senderId: userProfile.id,
            receiverId: otherParticipantId || "all",
            timestamp: new Date().toISOString(),
          });
        }
      });
    }

    // Simulate message being delivered after a delay
    setTimeout(() => {
      if (!conversationId) return;

      const updatedConversation = getConversation(conversationId);
      if (updatedConversation) {
        const lastMessage =
          updatedConversation.messages[updatedConversation.messages.length - 1];
        if (lastMessage && lastMessage.senderId === userProfile.id) {
          sendMessage(updatedConversation.id, {
            ...lastMessage,
            status: "delivered",
          });
        }
      }
    }, 1000);

    // Simulate message being read after a delay
    setTimeout(() => {
      if (!conversationId) return;

      const updatedConversation = getConversation(conversationId);
      if (updatedConversation) {
        const lastMessage =
          updatedConversation.messages[updatedConversation.messages.length - 1];
        if (lastMessage && lastMessage.senderId === userProfile.id) {
          sendMessage(updatedConversation.id, {
            ...lastMessage,
            status: "read",
          });
        }
      }

      // Removed fake typing simulation - typing should only be triggered by actual user input
    }, 2000);
  };

  const getRandomResponse = () => {
    const responses = [
      "Got it, thanks for the update!",
      "I'll check on that and get back to you.",
      "When do you need this delivered by?",
      "Can you provide more details about the shipment?",
      "I'll be there on time, don't worry.",
      "The traffic is a bit heavy, might be delayed by 15 minutes.",
      "Do you have a loading dock at the delivery location?",
      "Is there a specific entrance I should use?",
      "I've arrived at the pickup location.",
      "The cargo is loaded and secured. On my way to delivery now.",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleTypingStart = (data: any) => {
    const userId = data.userId || data.user_id || data.senderId || data.sender_id;
    const conversationId = data.conversationId || data.conversation_id || data.conversationId;

    if (!userId || !conversationId) {
      console.error('❌ Missing userId or conversationId in typing event:', { userId, conversationId });
      return;
    }

    // Don't show typing for current user
    if (String(userId) === String(userProfile?.id)) {
      return;
    }

    // Try to find the participant name
    let userName = data.userName || data.user_name || data.name || data.firstName;

    if (!userName) {
      // Try to find from participantsinConv
      if (participantsinConv && Array.isArray(participantsinConv)) {
        const participant = participantsinConv.find(
          (p: any) => String(p.id || p.userId || p.user?.id) === String(userId)
        );
        if (participant) {
          const user = (participant as any).user || participant;
          userName = user.name || user.userName || user.firstName || user.displayName;
        }
      }

      // Try to find from API conversation participants
      if (!userName && apiConversation?.participants) {
        const participant = apiConversation.participants.find(
          (p: any) => String(p.id || p.userId || p.user?.id) === String(userId)
        );
        if (participant) {
          const user = (participant as any).user || participant;
          userName = user.userName || user.firstName || user.name || user.displayName;
        }
      }

      // Try to find from selectedParticipant
      if (!userName && selectedParticipant && String(selectedParticipant.id) === String(userId)) {
        userName = selectedParticipant.userName || selectedParticipant.firstName;
      }
    }

    if (userName && userName !== 'Someone') {
      console.log('💬 Chat component - Starting typing for user:', { userId, conversationId, userName });
      startTyping(conversationId, userId, userName);
    } else {
      console.log('💬 Chat component - No valid name found for typing user:', userId);
    }
  };

  const handleTypingStop = (data: any) => {
    const userId = data.userId || data.user_id || data.senderId || data.sender_id;
    const conversationId = data.conversationId || data.conversation_id || data.conversationId;

    if (!userId || !conversationId) {
      console.error('❌ Missing userId or conversationId in typing event:', { userId, conversationId });
      return;
    }

    // Don't handle typing stop for current user
    if (String(userId) === String(userProfile?.id)) {
      return;
    }

    console.log('💬 Chat component - Stopping typing for user:', { userId, conversationId });
    stopTyping(conversationId, userId);
  };

  const handleInputChange = (text: string) => {
    setMessage(text);
    console.log("🔍 handleInputChange called with text length:", text.length);

    if (userProfile && conversation) {
      if (text.length > 0) {
        // Clear any existing timeout when user starts typing again
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }

        console.log('⌨️ Starting typing for user:', userProfile.id, 'in conversation:', conversationId);

        // Get current user name from participantsinConv first, then fallback to other sources
        let currentUserName = 'You';

        // First priority: Get from participantsinConv (route params - most reliable)
        if (participantsinConv && Array.isArray(participantsinConv)) {
          const currentUserParticipant = participantsinConv.find(
            (p: any) => String(p.id || p.userId || p.user?.id) === String(userProfile.id)
          );
          if (currentUserParticipant) {
            const user = (currentUserParticipant as any).user || currentUserParticipant;
            currentUserName = user.name || user.userName || 'You';
            console.log("Chat screen - Found current user name in participantsinConv:", currentUserName);
          }
        }

        // Second priority: Get from API conversation participants
        if (currentUserName === 'You' && apiConversation?.participants) {
          const currentUserParticipant = apiConversation.participants.find(
            (p: any) => String(p.id || p.userId || p.user?.id) === String(userProfile.id)
          );
          if (currentUserParticipant) {
            const user = (currentUserParticipant as any).user || currentUserParticipant;
            currentUserName = user.userName || user.firstName || user.name || user.displayName || 'You';
            console.log("Chat screen - Found current user name in apiConversation:", currentUserName);
          }
        }

        // Fallback to userProfile if not found in API data
        if (currentUserName === 'You') {
          currentUserName = userProfile.userName || userProfile.firstName || 'You';
          console.log("Chat screen - Using fallback current user name:", currentUserName);
        }

        console.log("Chat screen - Using current user name for typing:", currentUserName);
        console.log("Chat screen - Calling startTyping for current user with:", { conversationId, userId: userProfile.id, currentUserName });
        startTyping(conversationId, userProfile.id, currentUserName);
        // Emit typing start via socket
        import("@app/service/socket-service").then(({ socketService }) => {
          if (socketService.isSocketConnected()) {
            console.log('⌨️ Emitting TYPING_START for conversation:', conversationId);
            socketService.emitTypingStart(conversationId);
          } else {
            console.log('❌ Socket not connected, cannot emit typing start');
          }
        });
      } else {
        // Clear any existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Set a new timeout to stop typing after 2 seconds
        typingTimeoutRef.current = setTimeout(() => {
          console.log('⌨️ Stopping typing for user:', userProfile.id, 'in conversation:', conversationId);
          stopTyping(conversationId, userProfile.id);
        }, 2000);
        // Emit typing stop via socket
        import("@app/service/socket-service").then(({ socketService }) => {
          if (socketService.isSocketConnected()) {
            console.log('⌨️ Emitting TYPING_STOP for conversation:', conversationId);
            socketService.emitTypingStop(conversationId);
          } else {
            console.log('❌ Socket not connected, cannot emit typing stop');
          }
        });
      }
    }
  };

  const handleAttachment = async (type: "image" | "document" | "location") => {
    if (!userProfile || !conversation || !conversationId) return;

    setShowAttachments(false);

    if (type === "image") {
      // Show image picker options
      setShowImagePicker(true);
      return;
    }

    let content = "";
    let messageType = type;
    let fileUrl = "";
    let fileName = "";
    let fileSize = 0;

    switch (type) {
      case "document":
        // Handle document selection with DocumentPicker
        handleDocumentSelection();
        return;
      case "location":
        content = "Location shared: Los Angeles, CA";
        break;
    }

    try {
      console.log("Chat screen - Sending attachment via API:", type);

      // Send attachment via API
      const messageData: SendMessageRequest = {
        content,
        messageType,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
      };

      const apiResponse = await sendMessageToConversation(
        conversationId,
        messageData
      );
      console.log("Chat screen - Attachment sent successfully:", apiResponse);

      // Convert API response to local message format
      const newMessage: Message = {
        id: apiResponse.id.toString(),
        conversationId: apiResponse.conversationId.toString(),
        senderId: (apiResponse.senderUserId || userProfile.id).toString(),
        receiverId: (apiResponse.receiverUserId || "all").toString(),
        type: apiResponse.messageType as any,
        content: apiResponse.content,
        timestamp: apiResponse.sentAt,
        read: !!apiResponse.readAt,
        delivered: !!apiResponse.deliveredAt,
        status: (() => {
          if (apiResponse.readAt) return "read";
          if (apiResponse.deliveredAt) return "delivered";
          return "sent";
        })(),
        metadata: apiResponse.metadata,
      };

      // Message sent via API - no need to add to store since we're using API messages
    } catch (error) {
      console.error("Chat screen - Error sending attachment:", error);

      // Fallback: message failed - no need to add to store since we're using API messages
    }
  };

  const handlePauseResume = async () => {
    if (!audioRecorderPlayer.current) return;

    try {
      if (isPaused) {
        // Resume recording
        console.log("🎤 Voice Recording - Resuming recording");
        await audioRecorderPlayer.current.resumeRecorder();
        setIsPaused(false);

        // Resume pulsing animation
        const startPulseAnimation = () => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnim, {
                toValue: 0.3,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              }),
            ])
          ).start();
        };
        startPulseAnimation();
      } else {
        // Pause recording
        console.log("🎤 Voice Recording - Pausing recording");
        await audioRecorderPlayer.current.pauseRecorder();
        setIsPaused(true);

        // Stop pulsing animation
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
      }
    } catch (error) {
      console.error("🎤 Voice Recording - Error in pause/resume:", error);
    }
  };

  const handleRecordVoice = async () => {
    if (!userProfile || !conversation || !conversationId) return;

    console.log("🎤 Voice Recording - Starting handleRecordVoice", {
      userProfile: !!userProfile,
      conversation: !!conversation,
      conversationId,
      isRecording,
    });

    try {
      // Request audio recording permission on Android
      if (Platform.OS === 'android') {
        console.log("🎤 Voice Recording - Checking Android permissions");
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );

        console.log("🎤 Voice Recording - Permission check result:", hasPermission);

        if (!hasPermission) {
          console.log("🎤 Voice Recording - Requesting RECORD_AUDIO permission");
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Audio Recording Permission',
              message: 'This app needs access to your microphone to record voice messages.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          console.log("🎤 Voice Recording - Permission request result:", granted);

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log("🎤 Voice Recording - Permission denied:", granted);
            if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
              console.log("🎤 Voice Recording - Permission permanently denied, showing settings alert");
              Alert.alert(
                'Permission Required',
                'Microphone permission is required to record voice messages. Please enable it in app settings.',
                [
                  { text: 'Cancel' },
                  { text: 'Open Settings', onPress: () => Linking.openSettings() },
                ]
              );
            } else {
              console.log("🎤 Voice Recording - Permission denied, showing warning message");
              showMessage({
                message: 'Microphone permission is required to record voice messages',
                type: 'warning',
              });
            }
            return;
          }
          console.log("🎤 Voice Recording - Permission granted successfully");
        } else {
          console.log("🎤 Voice Recording - Permission already granted");
        }
      }

      if (!isRecording) {
        // Start recording
        console.log("🎤 Voice Recording - Starting recording process");
        setIsRecording(true);

        // Start pulsing animation
        const startPulseAnimation = () => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnim, {
                toValue: 0.3,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              }),
            ])
          ).start();
        };
        startPulseAnimation();

        const path = Platform.select({
          ios: `${RNFS.DocumentDirectoryPath}/voice_recording.m4a`,
          android: `${RNFS.CachesDirectoryPath}/voice_recording.mp3`,
        });

        console.log("🎤 Voice Recording - Recording path:", path);
        console.log("🎤 Voice Recording - Platform:", Platform.OS);

        const audioSet: AudioSet = {
          AVSampleRateKeyIOS: 44100,
          AVFormatIDKeyIOS: 'aac' as any,
          AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
          AVNumberOfChannelsKeyIOS: 2,
          AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
          AudioSourceAndroid: AudioSourceAndroidType.MIC,
          // Common audio settings
          AudioSamplingRate: 44100,
          AudioEncodingBitRate: 128000,
          AudioChannels: 1,
        };

        console.log("🎤 Voice Recording - AudioSet configuration:", audioSet);
        console.log("🎤 Voice Recording - audioRecorderPlayer.current:", !!audioRecorderPlayer.current);

        const result = await audioRecorderPlayer.current?.startRecorder(path, audioSet);
        console.log("🎤 Voice Recording - startRecorder result:", result);
        setRecordingPath(result || '');

        audioRecorderPlayer.current?.addRecordBackListener((e: any) => {
          const duration = Math.floor(e.currentPosition / 1000);
          console.log("🎤 Voice Recording - Recording duration update:", duration, "seconds");
          setRecordingDuration(duration);
        });

      } else {
        // Stop recording and upload
        console.log("🎤 Voice Recording - Stopping recording process");
        console.log("🎤 Voice Recording - Current recording duration:", recordingDuration, "seconds");
        console.log("🎤 Voice Recording - Current recording path:", recordingPath);

        const result = await audioRecorderPlayer.current?.stopRecorder();
        console.log("🎤 Voice Recording - stopRecorder result:", result);

        audioRecorderPlayer.current?.removeRecordBackListener();
        setIsRecording(false);
        setIsPaused(false);

        // Stop pulsing animation
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);

        if (result && recordingDuration > 0) {
          console.log("🎤 Voice Recording - Recording completed successfully");
          console.log("🎤 Voice Recording - Final file path:", result);
          console.log("🎤 Voice Recording - Final duration:", recordingDuration, "seconds");

          // Upload and send the voice message using the new saga
          try {
            console.log("🎤 Saga - Starting voice message upload and send");
            console.log("🎤 Saga - Parameters:", {
              conversationId,
              filePath: result,
              fileName: `voice_${Date.now()}.m4a`,
              duration: recordingDuration
            });

            const fileName = `voice_${Date.now()}.m4a`;

            // Create temporary message for immediate display
            const tempMessage: Message = {
              id: `temp_voice_${Date.now()}`,
              conversationId: conversationId,
              senderId: userProfile.id.toString(),
              receiverId: otherParticipantId || "all",
              type: "voice",
              content: `Voice message (${recordingDuration}s)`,
              timestamp: new Date().toISOString(),
              read: false,
              delivered: false,
              status: "sending",
              metadata: {
                fileUrl: result, // Local URI for preview
                fileName: fileName,
                fileSize: 0,
                fileType: 'audio',
                duration: recordingDuration,
              },
            };

            // Add to socket messages for immediate display
            addSocketMessage(tempMessage);

            // Step 1: Upload voice file using saga
            dispatch(uploadVoiceMessageAction(
              {
                fileUri: result,
                fileName: fileName,
                duration: recordingDuration
              },
              // onSuccess callback for upload
              async (uploadResponse: any) => {
                console.log("🎤 Saga - Voice upload successful:", uploadResponse);

                // Step 2: Send message using saga
                const messageData = {
                  content: fileName || 'Voice message',
                  messageType: 'file' as const,
                  fileUrl: uploadResponse.data?.url || uploadResponse.url,
                  fileName: uploadResponse.data?.key || uploadResponse.key || fileName,
                  fileSize: uploadResponse.data?.size || uploadResponse.size,
                  fileType: 'audio',
                };

                const apiResponse = await sendMessageToConversation(
                  conversationId,
                  messageData
                );
                console.log(apiResponse, 'apiResponse audop')

                // Convert API response to local message format and add to socket messages
                const newMessage: Message = {
                  id: apiResponse.id.toString(),
                  conversationId: apiResponse.conversationId.toString(),
                  senderId: (apiResponse.senderUserId || userProfile.id).toString(),
                  receiverId: (apiResponse.receiverUserId || "all").toString(),
                  type: apiResponse.messageType as any,
                  content: apiResponse.content,
                  timestamp: apiResponse.sentAt,
                  read: !!apiResponse.readAt,
                  delivered: !!apiResponse.deliveredAt,
                  status: (() => {
                    if (apiResponse.readAt) return "read";
                    if (apiResponse.deliveredAt) return "delivered";
                    return "sent";
                  })(),
                  metadata: {
                    ...apiResponse.metadata,
                    fileUrl: uploadResponse.data?.url || uploadResponse.url,
                    fileName: uploadResponse.data?.key || uploadResponse.key || fileName,
                    fileSize: uploadResponse.data?.size || uploadResponse.size,
                    fileType: 'audio',
                    duration: Math.round(recordingDuration),
                  },
                };

                // Replace temporary message with real message
                setSocketMessages((prev) =>
                  prev.map((msg) => (msg.id === tempMessage.id ? newMessage : msg))
                );

                // Reset recording state
                setRecordingPath("");
                setRecordingDuration(0);

                console.log("🎤 Voice Recording - State reset completed");

              },

              (uploadError: any) => {
                console.error("🎤 Saga - Error uploading voice message:", uploadError);

                // Update temporary message status to failed
                setSocketMessages((prev) =>
                  prev.map((msg) =>
                    msg.id.startsWith('temp_voice_') ? { ...msg, status: "failed" } : msg
                  )
                );

                showMessage({
                  message: "Failed to upload voice message",
                  type: "danger",
                });
              }
            ));

          } catch (error) {
            console.error("🎤 Saga - Error in voice message process:", error);
            console.error("🎤 Saga - Error details:", {
              message: error?.message,
              stack: error?.stack,
              conversationId,
              filePath: result,
              duration: recordingDuration
            });

            // Update temporary message status to failed
            setSocketMessages((prev) =>
              prev.map((msg) =>
                msg.id.startsWith('temp_voice_') ? { ...msg, status: "failed" } : msg
              )
            );

            showMessage({
              message: "Failed to process voice message",
              type: "danger",
            });
          }
        } else {
          console.log("🎤 Voice Recording - Recording failed or too short");
          console.log("🎤 Voice Recording - Result:", result);
          console.log("🎤 Voice Recording - Duration:", recordingDuration);
        }
      }
    } catch (error) {
      console.error("Chat screen - Error in voice recording:", error);
      setIsRecording(false);
      showMessage({
        message: "Voice recording failed",
        type: "danger",
      });
    }
  };

  const handleCall = () => {
    if (otherParticipantId) {
      (navigation as any).navigate("CallScreen", {
        userId: otherParticipantId,
      });
    }
  };

  const loadMoreMessages = () => {
    if (isLoadingMore || !hasMoreMessages) return;

    console.log(
      "Chat screen - Loading more messages, current page:",
      currentPage
    );
    fetchConversationData(currentPage + 1, true);
  };

  const handleImagePickerResponse = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      console.log("Image picker cancelled or error:", response.errorMessage);
      setShowImagePicker(false);
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const imageUris = response.assets
        .map(asset => asset.uri)
        .filter(uri => uri !== undefined) as string[];

      if (imageUris.length > 0) {
        // If we already have images, append new ones; otherwise replace
        if (selectedImages.length > 0) {
          setSelectedImages(prev => [...prev, ...imageUris]);
        } else {
          setSelectedImages(imageUris);
        }
        setImageText("");
        setShowImageModal(true);
        setShowImagePicker(false);
      }
    }
  };

  const handleSelectFromGallery = () => {
    const options = {
      mediaType: "photo" as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.5,
      selectionLimit: 10, // Allow up to 10 images
    };

    launchImageLibrary(options, handleImagePickerResponse);
  };

  const handleTakePhoto = () => {
    const options = {
      mediaType: "photo" as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.5,
    };

    launchCamera(options, handleImagePickerResponse);
  };

  // Handle image click to show full screen
  const handleImageClick = (imageUrl: string) => {
    console.log("Chat screen - Image clicked:", imageUrl);
    setFullImageUrl(imageUrl);
    setShowFullImageModal(true);
  };

  // Handle document click to show full screen
  const handleDocumentClick = (documentUrl: string) => {
    setDocUrl(documentUrl);
    // console.log("Chat screen - Document clicked:", documentUrl);
    const googleDocsUrlNew = `https://docs.google.com/viewer?url=${encodeURIComponent(
      documentUrl
    )}&embedded=true`;
    setGoogleDocsUrl(googleDocsUrlNew);
    console.log("Chat screen - Document clicked:", googleDocsUrlNew);
    setFullImageUrl(null); // Clear image URL for documents
    setShowFullImageModal(true);
  };

  // Close full screen image
  const closeFullImageModal = () => {
    setShowFullImageModal(false);
    setFullImageUrl(null);
    setGoogleDocsUrl("");
  };

  // Fallback function to send image directly if upload callback fails
  const handleSendImageDirectly = async (
    imageUri: string,
    messageContent: string,
    tempMessage: Message
  ) => {
    try {
      console.log(
        "Chat screen - Fallback: Sending image directly with local URI"
      );

      const messageData: SendMessageRequest = {
        content: messageContent, // Send text content
        messageType: "image", // Use image type for image messages
        fileUrl: imageUri, // Send image URI in fileUrl field
        fileName: "image.jpg",
        fileSize: 512,
        fileType: "image", // Specify file type as image
      };

      console.log(
        "Chat screen - Fallback: Sending message with local URI:",
        messageData
      );

      const apiResponse = await sendMessageToConversation(
        conversationId,
        messageData
      );

      console.log(
        "Chat screen - Fallback: Message sent successfully:",
        apiResponse
      );

      // Convert API response to local message format
      const newMessage: Message = {
        id: apiResponse.id.toString(),
        conversationId: apiResponse.conversationId.toString(),
        senderId: (apiResponse.senderUserId || userProfile.id).toString(),
        receiverId: (apiResponse.receiverUserId || "all").toString(),
        type: apiResponse.messageType as any,
        content: apiResponse.content, // This will be the text content
        timestamp: apiResponse.sentAt,
        read: !!apiResponse.readAt,
        delivered: !!apiResponse.deliveredAt,
        status: "sent",
        metadata: {
          ...apiResponse.metadata,
          fileUrl: imageUri, // Ensure fileUrl is in metadata
          fileName: "image.jpg",
          fileSize: 512,
          fileType: "image", // Specify file type as image
        },
      };

      // Replace temporary message with real message
      setSocketMessages((prev) =>
        prev.map((msg) => (msg.id === tempMessage.id ? newMessage : msg))
      );

      // Show success message
      showMessage({
        message: "Image sent successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Chat screen - Fallback: Error sending message:", error);

      // Update temporary message status to failed
      setSocketMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? { ...msg, status: "failed" } : msg
        )
      );

      showMessage({
        message: "Failed to send image. Please try again.",
        type: "danger",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSendImageWithText = async () => {
    if (!userProfile || !conversation || !conversationId || !selectedImage)
      return;

    const messageContent = imageText.trim() || "Image shared";
    setImageText("");
    setShowImageModal(false);
    setIsUploadingImage(true);

    // Create temporary message for immediate display
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      conversationId: conversationId,
      senderId: userProfile.id.toString(),
      receiverId: otherParticipantId || "all",
      type: "file", // Use file type for messages with attachments
      content: messageContent, // Text content for preview
      timestamp: new Date().toISOString(),
      read: false,
      delivered: false,
      status: "sending",
      metadata: {
        fileUrl: selectedImage, // Local URI for preview
        fileName: "image.jpg",
        fileSize: 512,
      },
    };

    // Add to socket messages for immediate display
    addSocketMessage(tempMessage);

    console.log("Chat screen - Starting image upload process");
    console.log("Chat screen - Selected image URI:", selectedImage);
    console.log("Chat screen - Message content:", messageContent);

    // Step 1: Upload image using Redux saga
    const fileData = {
      uri: selectedImage,
      type: "image/jpeg",
      name: "image.jpg",
    };

    console.log(
      "Chat screen - Dispatching uploadFile action with file:",
      fileData
    );

    // Add a fallback timeout in case the callback doesn't work
    const fallbackTimeout = setTimeout(() => {
      console.log(
        "Chat screen - Fallback: Upload callback didn't execute, trying direct approach"
      );
      // Try to send message directly with local URI as fallback
      handleSendImageDirectly(selectedImage, messageContent, tempMessage);
    }, 5000);

    dispatch(
      uploadFile(
        fileData,
        // onSuccess callback
        (uploadResponse: any) => {
          console.log("Chat screen - Upload successful callback triggered");
          console.log("Chat screen - Upload response:", uploadResponse);
          console.log(
            "Chat screen - Upload response type:",
            typeof uploadResponse
          );
          console.log(
            "Chat screen - Upload response keys:",
            Object.keys(uploadResponse || {})
          );

          // Clear the fallback timeout since callback executed
          clearTimeout(fallbackTimeout);

          // Use setTimeout to ensure the callback is executed properly
          setTimeout(async () => {
            try {
              console.log("Chat screen - Starting message sending process");

              // Step 2: Send message with uploaded image URL
              const imageUrl = uploadResponse.data?.url || uploadResponse.url;
              const messageData: SendMessageRequest = {
                content: messageContent, // Send text content
                messageType: "image", // Use image type for image messages
                fileUrl: imageUrl, // Send image URL in fileUrl field
                fileName: uploadResponse.data?.fileName || "image.jpg",
                fileSize: uploadResponse.data?.fileSize || 512,
                fileType: "image", // Specify file type as image
              };

              console.log(
                "Chat screen - Sending message with uploaded image:",
                messageData
              );
              console.log("Chat screen - Conversation ID:", conversationId);

              const apiResponse = await sendMessageToConversation(
                conversationId,
                messageData
              );

              console.log(
                "Chat screen - Message sent successfully:",
                apiResponse
              );

              // Convert API response to local message format
              const newMessage: Message = {
                id: apiResponse.id.toString(),
                conversationId: apiResponse.conversationId.toString(),
                senderId: (
                  apiResponse.senderUserId || userProfile.id
                ).toString(),
                receiverId: (apiResponse.receiverUserId || "all").toString(),
                type: apiResponse.messageType as any,
                content: apiResponse.content, // This will be the text content
                timestamp: apiResponse.sentAt,
                read: !!apiResponse.readAt,
                delivered: !!apiResponse.deliveredAt,
                status: "sent",
                metadata: {
                  ...apiResponse.metadata,
                  fileUrl: imageUrl, // Ensure fileUrl is in metadata
                  fileName: uploadResponse.data?.fileName || "image.jpg",
                  fileSize: uploadResponse.data?.fileSize || 512,
                  fileType: "image", // Specify file type as image
                },
              };

              // Replace temporary message with real message
              setSocketMessages((prev) =>
                prev.map((msg) =>
                  msg.id === tempMessage.id ? newMessage : msg
                )
              );

              // Emit message via socket for real-time delivery
              import("@app/service/socket-service").then(
                ({ socketService }) => {
                  if (socketService.isSocketConnected()) {
                    socketService.emitNewMessage({
                      conversationId: conversationId,
                      content: messageContent, // Send text content
                      messageType: "image",
                      fileUrl: imageUrl, // Send image URL in fileUrl
                      fileType: "image", // Specify file type as image
                    });
                  }
                }
              );

              // Show success message
              showMessage({
                message: "Image sent successfully!",
                type: "success",
              });
            } catch (error) {
              console.error(
                "Chat screen - Error sending message after upload:",
                error
              );

              // Update temporary message status to failed
              setSocketMessages((prev) =>
                prev.map((msg) =>
                  msg.id === tempMessage.id ? { ...msg, status: "failed" } : msg
                )
              );

              showMessage({
                message: "Failed to send message. Please try again.",
                type: "danger",
              });
            } finally {
              setIsUploadingImage(false);
            }
          }, 100); // Small delay to ensure proper execution
        },
        // onError callback
        (error: any) => {
          console.error("Chat screen - Upload failed:", error);

          // Update temporary message status to failed
          setSocketMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempMessage.id ? { ...msg, status: "failed" } : msg
            )
          );

          showMessage({
            message: "Failed to upload image. Please try again.",
            type: "danger",
          });

          setIsUploadingImage(false);
        }
      )
    );
  };

  const handleSendMultipleImages = async () => {
    if (!userProfile || !conversation || !conversationId || selectedImages.length === 0)
      return;

    const messageContent = imageText.trim() || `${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''} shared`;
    setImageText("");
    setShowImageModal(false);
    setIsUploadingImage(true);

    try {
      // Send each image sequentially to avoid conflicts
      for (let i = 0; i < selectedImages.length; i++) {
        const imageUri = selectedImages[i];

        console.log("Chat screen - Processing image:", i + 1, "of", selectedImages.length);

        // Create temporary message for immediate display
        const tempMessage: Message = {
          id: `temp_image_${Date.now()}_${i}`,
          conversationId: conversationId,
          senderId: userProfile.id.toString(),
          receiverId: otherParticipantId || "all",
          type: "file", // Use file type for messages with attachments
          content: i === 0 ? messageContent : `Image ${i + 1}`, // Only first image gets the caption
          timestamp: new Date().toISOString(),
          read: false,
          delivered: false,
          status: "sending",
          metadata: {
            fileUrl: imageUri, // Local URI for preview
            fileName: `image_${Date.now()}_${i}.jpg`,
            fileSize: 512,
          },
        };

        // Add to socket messages for immediate display
        addSocketMessage(tempMessage);

        console.log("Chat screen - Starting image upload process for image:", i + 1);
        console.log("Chat screen - Selected image URI:", imageUri);

        // Add a fallback timeout in case the callback doesn't work
        const fallbackTimeout = setTimeout(() => {
          console.log("Chat screen - Fallback timeout triggered for image:", i + 1);
          if (i === selectedImages.length - 1) {
            setIsUploadingImage(false);
          }
        }, 30000); // 30 second timeout

        // Wait for this upload to complete before starting the next one
        await new Promise((resolve, reject) => {
          dispatch(
            uploadFile(
              {
                uri: imageUri,
                type: "image/jpeg",
                name: `image_${Date.now()}_${i}.jpg`,
              },
              // onSuccess callback for upload
              async (uploadResponse: any) => {
                clearTimeout(fallbackTimeout);
                console.log("Chat screen - Image upload successful:", uploadResponse);

                try {
                  // Step 2: Send message using saga
                  const messageData = {
                    content: i === 0 ? messageContent : `Image ${i + 1}`,
                    messageType: 'image' as const,
                    fileUrl: uploadResponse.data?.url || uploadResponse.url,
                    fileName: uploadResponse.data?.key || uploadResponse.key || `image_${Date.now()}_${i}.jpg`,
                    fileSize: uploadResponse.data?.size || uploadResponse.size,
                    fileType: 'image',
                  };

                  const apiResponse = await sendMessageToConversation(
                    conversationId,
                    messageData
                  );

                  // Convert API response to local message format and add to socket messages
                  const newMessage: Message = {
                    id: apiResponse.id.toString(),
                    conversationId: apiResponse.conversationId.toString(),
                    senderId: (apiResponse.senderUserId || userProfile.id).toString(),
                    receiverId: (apiResponse.receiverUserId || "all").toString(),
                    type: apiResponse.messageType as any,
                    content: apiResponse.content,
                    timestamp: apiResponse.sentAt,
                    read: !!apiResponse.readAt,
                    delivered: !!apiResponse.deliveredAt,
                    status: (() => {
                      if (apiResponse.readAt) return "read";
                      if (apiResponse.deliveredAt) return "delivered";
                      return "sent";
                    })(),
                    metadata: {
                      ...apiResponse.metadata,
                      fileUrl: uploadResponse.data?.url || uploadResponse.url,
                      fileName: uploadResponse.data?.key || uploadResponse.key || `image_${Date.now()}_${i}.jpg`,
                      fileSize: uploadResponse.data?.size || uploadResponse.size,
                      fileType: 'image',
                    },
                  };

                  // Replace temporary message with real message
                  setSocketMessages((prev) =>
                    prev.map((msg) => (msg.id === tempMessage.id ? newMessage : msg))
                  );

                  console.log("Chat screen - Image message sent successfully:", i + 1);
                  resolve(true);
                } catch (error) {
                  console.error("Chat screen - Error sending message:", error);
                  reject(error);
                }
              },
              // onError callback for upload
              (uploadError: any) => {
                clearTimeout(fallbackTimeout);
                console.error("Chat screen - Error uploading image:", uploadError);

                // Update temporary message status to failed
                setSocketMessages((prev) =>
                  prev.map((msg) =>
                    msg.id.startsWith('temp_image_') ? { ...msg, status: "failed" } : msg
                  )
                );

                showMessage({
                  message: "Failed to upload image",
                  type: "danger",
                });

                reject(uploadError);
              }
            )
          );
        });
      }

      // Reset image selection and upload state
      setSelectedImages([]);
      setIsUploadingImage(false);

    } catch (error) {
      console.error("Chat screen - Error in image upload process:", error);

      // Update temporary message status to failed
      setSocketMessages((prev) =>
        prev.map((msg) =>
          msg.id.startsWith('temp_image_') ? { ...msg, status: "failed" } : msg
        )
      );

      showMessage({
        message: "Failed to process images",
        type: "danger",
      });

      setIsUploadingImage(false);
    }
  };

  const handleDocumentSelection = async () => {
    console.log("Chat screen - Opening document picker");

    try {
      // Use @react-native-documents/picker to open file manager
      const result = await pick({
        allowMultiSelection: false,
        type: [
          types.pdf,
          types.doc,
          types.docx,
          types.xls,
          types.xlsx,
          types.images,
        ],
      });

      console.log("Chat screen - DocumentPicker result:", result);

      if (result && result.length > 0) {
        const document = result[0];
        console.log("Document selected:", document);

        // Check if the selected file is an image
        const isImage = document.type && document.type.startsWith("image/");

        if (isImage) {
          // If it's an image, handle it as an image
          setSelectedImage(document.uri);
          setShowImageModal(true);
        } else {
          // Handle as document
          await handleSendDocument({
            uri: document.uri,
            fileName: document.name,
            type: document.type,
            fileSize: document.size,
          });
        }
      }
    } catch (error) {
      console.error("Chat screen - Document picker error:", error);

      // User cancelled picker or error occurred
      if (error.code !== "DOCUMENT_PICKER_CANCELED") {
        console.warn("DocumentPicker error:", error);
        showMessage({
          message: "Failed to select document. Please try again.",
          type: "danger",
        });
      } else {
        console.log("Document selection cancelled by user");
      }
    }
  };

  const handleSendDocument = async (documentAsset: any) => {
    if (!userProfile || !conversation || !conversationId) return;

    const fileName = documentAsset.fileName || `document_${Date.now()}`;
    const fileType = documentAsset.type || "application/octet-stream";
    const fileSize = documentAsset.fileSize || 0;

    console.log("Chat screen - Sending document:", {
      fileName,
      fileType,
      fileSize,
      uri: documentAsset.uri,
    });

    // Create temporary message for immediate display
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      conversationId: conversationId,
      senderId: userProfile.id.toString(),
      receiverId: otherParticipantId || "all",
      type: "document",
      content: `Document: ${fileName}`,
      timestamp: new Date().toISOString(),
      read: false,
      delivered: false,
      status: "sending",
      metadata: {
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileType,
        fileUrl: documentAsset.uri,
      },
    };

    // Add to socket messages for immediate display
    addSocketMessage(tempMessage);

    try {
      // Step 1: Upload the document file
      const fileData = {
        uri: documentAsset.uri,
        type: fileType,
        name: fileName,
      };

      console.log("Chat screen - Uploading document file:", fileData);

      // Set a fallback timeout in case the callback doesn't execute
      const fallbackTimeout = setTimeout(() => {
        console.log("Chat screen - Document upload callback timeout");
        updateSocketMessageStatus(tempMessage.id, "failed");
        showMessage({
          message: "Document upload timeout. Please try again.",
          type: "danger",
        });
      }, 10000);

      dispatch(
        uploadFile(
          fileData,
          // onSuccess callback
          (uploadResponse: any) => {
            console.log(
              "Chat screen - Document upload successful:",
              uploadResponse
            );
            clearTimeout(fallbackTimeout);

            // Use setTimeout to ensure the callback is executed properly
            setTimeout(async () => {
              try {
                // Step 2: Send message with uploaded document URL
                const documentUrl =
                  uploadResponse.data?.url || uploadResponse.url;
                const messageData: SendMessageRequest = {
                  content: `Document: ${fileName}`,
                  messageType: "file",
                  fileUrl: documentUrl,
                  fileName: fileName,
                  fileSize: fileSize,
                  fileType: "document",
                };

                console.log(
                  "Chat screen - Sending document message:",
                  messageData
                );

                const apiResponse = await sendMessageToConversation(
                  conversationId,
                  messageData
                );

                console.log(
                  "Chat screen - Document message sent successfully:",
                  apiResponse
                );

                // Convert API response to local message format
                const newMessage: Message = {
                  id: apiResponse.id.toString(),
                  conversationId: apiResponse.conversationId.toString(),
                  senderId: (
                    apiResponse.senderUserId || userProfile.id
                  ).toString(),
                  receiverId: (apiResponse.receiverUserId || "all").toString(),
                  type: apiResponse.messageType as any,
                  content: apiResponse.content,
                  timestamp: apiResponse.sentAt,
                  read: !!apiResponse.readAt,
                  delivered: !!apiResponse.deliveredAt,
                  status: (() => {
                    if (apiResponse.readAt) return "read";
                    if (apiResponse.deliveredAt) return "delivered";
                    return "sent";
                  })(),
                  metadata: {
                    fileName: fileName,
                    fileSize: fileSize,
                    fileType: "document",
                    fileUrl: documentUrl,
                  },
                };

                // Replace temporary message with real message
                replaceSocketMessage(tempMessage.id, newMessage);

                console.log("Chat screen - Document sent successfully");

              } catch (error) {
                console.error(
                  "Chat screen - Error sending document message:",
                  error
                );
                updateSocketMessageStatus(tempMessage.id, "failed");
                showMessage({
                  message: "Failed to send document. Please try again.",
                  type: "danger",
                });
              }
            }, 100);
          },
          // onError callback
          (error: any) => {
            console.error("Chat screen - Document upload failed:", error);
            clearTimeout(fallbackTimeout);
            updateSocketMessageStatus(tempMessage.id, "failed");
            showMessage({
              message: "Failed to upload document. Please try again.",
              type: "danger",
            });
          }
        )
      );
    } catch (error) {
      console.error("Chat screen - Error in document upload process:", error);
      updateSocketMessageStatus(tempMessage.id, "failed");
      showMessage({
        message: "Failed to send document. Please try again.",
        type: "danger",
      });
    }
  };

  // Helper functions for socket message management
  const replaceSocketMessage = (tempId: string, newMessage: Message) => {
    setSocketMessages((prev) =>
      prev.map((msg) => (msg.id === tempId ? newMessage : msg))
    );
  };

  const updateSocketMessageStatus = (
    messageId: string,
    status: MessageStatus
  ) => {
    setSocketMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, status } : msg))
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatMessageDate = (timestamp: string) => {
    if (!timestamp) return "Unknown Date";

    const date = new Date(timestamp);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.log('Invalid timestamp in formatMessageDate:', timestamp);
      return "Invalid Date";
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to start of day for accurate comparison
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const messageStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    console.log('📅 Date Formatting Debug:', {
      timestamp,
      messageDate: date.toISOString(),
      messageStart: messageStart.toISOString(),
      todayStart: todayStart.toISOString(),
      yesterdayStart: yesterdayStart.toISOString(),
      messageDateString: messageStart.toDateString(),
      todayDateString: todayStart.toDateString()
    });

    if (messageStart.getTime() === todayStart.getTime()) {
      return "Today";
    } else if (messageStart.getTime() === yesterdayStart.getTime()) {
      return "Yesterday";
    } else {
      // Check if it's within the current week
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      if (date > weekAgo) {
        // Show day of week for recent messages
        return date.toLocaleDateString("en-US", {
          weekday: "long",
        });
      } else {
        // Show day and date for older messages
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });
      }
    }
  };

  const renderMessageStatus = (status?: MessageStatus) => {
    switch (status) {
      case "sent":
        return <Check size={14} color={Colors.white} />;
      case "delivered":
        return <CheckCheck size={14} color={Colors.white} />;
      case "read":
        return <CheckCheck size={14} color={Colors.white} />;
      default:
        return <Clock size={14} color={Colors.white} />;
    }
  };

  let currentSound: Sound | null = null;


  const renderMessage = ({
    item,
    index,
  }: {
    item: Message | MessageResponse;
    index: number;

  }) => {
    console.log("Chat screen - Rendering messagessss:", item);

    // Special debug for system messages
    if (item.senderId === "system" || (item as any).senderUserId === "system") {
      console.log("🚨 SYSTEM MESSAGE IN RENDER:", {
        messageId: item.id,
        content: item.content,
        senderId: item.senderId || (item as any).senderUserId,
        index: index
      });
    }

    if (!conversation || !userProfile) return null;

    // Convert item to Message format if it's MessageResponse
    const messageItem: Message = {
      id: item.id.toString(),
      conversationId: item.conversationId.toString(),
      senderId:
        (item as any).senderId || (item as any).senderUserId?.toString() || "",
      receiverId:
        (item as any).receiverId ||
        (item as any).receiverUserId?.toString() ||
        "all",
      type: (item as any).type || (item as any).messageType || "text",
      content: (item as any).content || "",
      timestamp:
        (item as any).timestamp ||
        (item as any).sentAt ||
        new Date().toISOString(),
      read: !!(item as any).read || !!(item as any).readAt,
      delivered: !!(item as any).delivered || !!(item as any).deliveredAt,
      status: (item as any).status || "sent",
      metadata: {
        ...((item as any).metadata || {}),
        fileUrl: (item as any).fileUrl || (item as any).metadata?.fileUrl,
        fileName: (item as any).fileName || (item as any).metadata?.fileName,
        fileSize: (item as any).fileSize || (item as any).metadata?.fileSize,
        fileType: (item as any).fileType || (item as any).metadata?.fileType,
      },
    };

    // Debug logging for file messages
    if (messageItem.type === "file" || messageItem.metadata?.fileUrl) {
      console.log("Chat screen - Debug renderMessage file message:", {
        messageId: messageItem.id,
        type: messageItem.type,
        content: messageItem.content,
        metadata: messageItem.metadata,
        originalItem: item,
      });
    }

    // Debug the converted messageItem
    console.log("🔍 Converted messageItem:", {
      id: messageItem.id,
      senderId: messageItem.senderId,
      content: messageItem.content,
      originalItem: item
    });

    // Check if this is a system message by content or senderId
    const isSystemMessage = String(messageItem.senderId) === "system" ||
      (messageItem.senderId === "" &&
        (messageItem.content.includes("Contract") ||
          messageItem.content.includes("started for Job") ||
          messageItem.content.includes("system")));

    // Ensure proper type comparison for isUser
    const isUser = String(messageItem.senderId) === String(userProfile.id);

    // Debug system message detection
    console.log("🔍 System Message Debug:", {
      messageId: messageItem.id,
      senderId: messageItem.senderId,
      senderIdString: String(messageItem.senderId),
      isSystemMessage,
      content: messageItem.content
    });

    // Additional debug for system messages
    if (messageItem.senderId === "system") {
      console.log("🚨 SYSTEM MESSAGE DETECTED:", {
        messageId: messageItem.id,
        content: messageItem.content,
        isSystemMessage,
        willRender: isSystemMessage
      });
    }
    // Get all messages for grouping logic
    const allMessages = getAllMessages();

    // Simple date comparison - just use the actual date
    const getDateString = (messageItem: any) => {
      const timestamp = messageItem.timestamp || messageItem.sentAt || messageItem.createdAt;
      if (!timestamp) return '';

      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.log('Invalid timestamp:', timestamp);
        return '';
      }

      // Just use the actual date - no manipulation
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // For inverted FlatList, we need to compare with the next message (which appears above in UI)
    const currentDate = getDateString(item);
    const nextDate = index < allMessages.length - 1 ? getDateString(allMessages[index + 1]) : '';

    // Debug logging for first few messages
    if (index < 5) {
      console.log('🔍 Date Comparison Debug (Inverted):', {
        index,
        totalMessages: allMessages.length,
        currentDate,
        nextDate,
        currentTimestamp: (item as any).timestamp || (item as any).sentAt,
        nextTimestamp: index < allMessages.length - 1 ? ((allMessages[index + 1] as any).timestamp || (allMessages[index + 1] as any).sentAt) : null,
        showDate: index === allMessages.length - 1 || currentDate !== nextDate,
        datesAreEqual: currentDate === nextDate,
        currentMessageContent: messageItem.content?.substring(0, 20)
      });
    }

    // For inverted FlatList: show date separator when:
    // 1. This is the last message (newest) in the list, OR
    // 2. The current message's date is different from the next message's date
    const showDate = index === allMessages.length - 1 || currentDate !== nextDate;

    const prevMessage = index > 0 ? allMessages[index - 1] : null;
    const nextMessage =
      index < allMessages.length - 1 ? allMessages[index + 1] : null;

    // For normal array order, first in group is first in array
    const isFirstInGroup =
      !prevMessage || prevMessage.senderId !== messageItem.senderId;
    const isLastInGroup =
      !nextMessage || nextMessage.senderId !== messageItem.senderId;

    // Get sender information from API response
    const senderInfo = apiConversation?.messages?.find(
      (apiMsg) => apiMsg.id.toString() === messageItem.id
    )?.sender;

    const getMessageBubbleStyle = () => {
      if (isUser) {
        return {
          ...styles.messageBubble,
          ...styles.userMessageBubble,
          ...(isFirstInGroup && isLastInGroup
            ? styles.singleMessageBubble
            : {}),
          ...(isFirstInGroup && !isLastInGroup
            ? styles.firstMessageBubble
            : {}),
          ...(!isFirstInGroup && isLastInGroup ? styles.lastMessageBubble : {}),
          ...(!isFirstInGroup && !isLastInGroup
            ? styles.middleMessageBubble
            : {}),
        };
      } else {
        return {
          ...styles.messageBubble,
          ...styles.otherMessageBubble,
          ...(isFirstInGroup && isLastInGroup
            ? styles.singleMessageBubble
            : {}),
          ...(isFirstInGroup && !isLastInGroup
            ? styles.firstMessageBubble
            : {}),
          ...(!isFirstInGroup && isLastInGroup ? styles.lastMessageBubble : {}),
          ...(!isFirstInGroup && !isLastInGroup
            ? styles.middleMessageBubble
            : {}),
        };
      }
    };

    // Special rendering for system messages
    if (isSystemMessage) {
      console.log("🎯 Rendering System Message:", {
        messageId: messageItem.id,
        content: messageItem.content,
        senderId: messageItem.senderId
      });
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{messageItem.content}</Text>
        </View>
      );
    }

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {formatMessageDate(messageItem.timestamp)}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.messageContainer,
            isUser ? styles.userMessageContainer : styles.otherMessageContainer,
            // Debug: Add background color to see alignment
          ]}
        >
          {!isUser && (
            <View style={styles.avatarContainer}>
              {senderInfo?.profileImage ? (
                <Image
                  source={{ uri: senderInfo.profileImage }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>
                    {senderInfo?.name?.charAt(0) || "?"}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View
            style={[
              styles.messageContent,
              isUser ? styles.userMessageContent : styles.otherMessageContent,
            ]}
          >
            {messageItem.type === "text" && (
              <View style={getMessageBubbleStyle()}>
                <Text style={styles.messageText}>{messageItem.content}</Text>
                {/* Debug: Show if this is detected as user message */}

                <View style={styles.messageTimeContainer}>
                  <Text style={styles.messageTime}>
                    {formatTime(messageItem.timestamp)}
                  </Text>
                  {isUser && (
                    <View style={styles.messageStatus}>
                      {renderMessageStatus(messageItem.status)}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Image and file messages */}
            {(() => {
              const hasFileUrl =
                messageItem.metadata?.fileUrl || (messageItem as any).fileUrl;
              const isImageType = messageItem.type === "image";
              const isFileType = messageItem.type === "file";
              const hasImageInContent =
                isImageType &&
                messageItem.content &&
                messageItem.content.startsWith("http");

              console.log("Chat screen - Debug file message:", {
                messageId: messageItem.id,
                type: messageItem.type,
                hasFileUrl: !!hasFileUrl,
                fileUrl: hasFileUrl,
                metadata: messageItem.metadata,
                isImageType,
                isFileType,
                hasImageInContent,
                shouldRender:
                  (isFileType && hasFileUrl) ||
                  (isImageType && (hasFileUrl || hasImageInContent)),
              });

              return (
                (isFileType && hasFileUrl) ||
                (isImageType && (hasFileUrl || hasImageInContent))
              );
            })() && (
                <View
                  style={[getMessageBubbleStyle(), styles.imageMessageBubble]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      const fileUrl = messageItem.metadata?.fileUrl ||
                        (messageItem as any).fileUrl ||
                        (messageItem.type === "image" ? messageItem.content : null);

                      // Check metadata.fileType to determine if it's image or document
                      if (messageItem.metadata?.fileType === "document") {
                        handleDocumentClick(fileUrl);
                      } else if (messageItem.metadata?.fileType === "image") {
                        handleImageClick(fileUrl);
                      }
                    }}
                    style={{ ...styles.imageContainer }}
                  >
                    {/* {messageItem.metadata?.fileType === "audio" &&
                    <AudioMessage url="https://loadrider.s3.us-east-1.amazonaws.com/1758909142541-voice_1758909137685.m4a" />
                  } */}
                    {messageItem.metadata?.fileType === "document" &&
                      <View style={{ height: 'auto', width: 300, flexDirection: 'row', padding: 10, alignItems: 'center', justifyContent: 'center' }}>
                        <File size={30} color={Colors.white} />

                      </View>}
                    {(messageItem.type === "voice" || messageItem.metadata?.fileType === "audio") && (
                      // <View style={[getMessageBubbleStyle(), styles.voiceMessageBubble,padding:0]}>
                      <AudioPlayer audioPath={
                        messageItem.metadata?.fileUrl ||
                        (messageItem as any).fileUrl ||
                        messageItem.content
                      } />
                      // </View>
                    )}
                    {messageItem.metadata?.fileType === "image" && <Image
                      source={{
                        uri:
                          messageItem.metadata?.fileUrl ||
                          (messageItem as any).fileUrl ||
                          (messageItem.type === "image"
                            ? messageItem.content
                            : 'null'),
                      }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />}
                  </TouchableOpacity>
                  {messageItem.content && messageItem.content.trim() && (
                    <Text style={styles.messageText}>{messageItem.content}</Text>
                  )}
                  <View style={styles.messageTimeContainer}>
                    <Text style={styles.messageTime}>
                      {formatTime(messageItem.timestamp)}
                    </Text>
                    {isUser && (
                      <View style={styles.messageStatus}>
                        {renderMessageStatus(messageItem.status)}
                      </View>
                    )}
                  </View>
                </View>
              )}


            {messageItem.type === "document" && (
              <View style={styles.compactDocumentBubble}>
                <TouchableOpacity
                  style={styles.compactDocumentContainer}
                  onPress={() => {
                    const fileUrl = messageItem.metadata?.fileUrl;
                    if (fileUrl) {
                      handleDocumentClick(fileUrl);
                    } else {
                      showMessage({
                        message: 'Error',
                        description: 'File URL not available',
                        type: 'danger',
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.compactDocumentIcon}>
                    <File
                      size={20}
                      color={isUser ? Colors.white : Colors.primary}
                    />
                  </View>
                  <Text
                    style={styles.compactDocumentName}
                    numberOfLines={1}
                  >
                    {messageItem.content}
                  </Text>
                </TouchableOpacity>
                <View style={styles.messageTimeContainer}>
                  <Text style={styles.messageTime}>
                    {formatTime(messageItem.timestamp)}
                  </Text>
                  {isUser && (
                    <View style={styles.messageStatus}>
                      {renderMessageStatus(messageItem.status)}
                    </View>
                  )}
                </View>
              </View>
            )}

            {messageItem.type === "location" && (
              <View
                style={[getMessageBubbleStyle(), styles.locationMessageBubble]}
              >
                <View style={styles.locationContainer}>
                  <View style={styles.locationHeader}>
                    <MapPin
                      size={16}
                      color={isUser ? Colors.white : Colors.primary}
                    />
                    <Text
                      style={[
                        styles.locationText,
                        { color: isUser ? Colors.white : Colors.text },
                      ]}
                    >
                      {messageItem.content}
                    </Text>
                  </View>
                  <Image
                    source={{
                      uri: "https://maps.googleapis.com/maps/api/staticmap?center=Los+Angeles,CA&zoom=13&size=300x150&maptype=roadmap&markers=color:red%7CLos+Angeles,CA&key=YOUR_API_KEY",
                    }}
                    style={styles.locationMap}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.messageTimeContainer}>
                  <Text style={styles.messageTime}>
                    {formatTime(messageItem.timestamp)}
                  </Text>
                  {isUser && (
                    <View style={styles.messageStatus}>
                      {renderMessageStatus(messageItem.status)}
                    </View>
                  )}
                </View>
              </View>
            )}

            {messageItem.type === "system" && (
              <View style={styles.systemMessageContainer}>
                <Text style={styles.systemMessageText}>
                  {messageItem.content}
                </Text>
              </View>
            )}
          </View>

          {!isUser && isFirstInGroup && <View style={styles.spacer} />}
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    const typingUsers = getTypingUsers(conversationId || '');
    console.log("🔍 Typing indicator - typingUsers:", typingUsers);
    console.log("🔍 Typing indicator - conversationId:", conversationId);

    if (typingUsers.length === 0) {
      console.log("🔍 Typing indicator - No typing users found");
      return null;
    }


    // Filter out current user from display first
    const otherTypingUsers = typingUsers.filter(user => String(user.userId) !== String(userProfile?.id));
    console.log("🔍 Typing indicator - otherTypingUsers:", otherTypingUsers);
    console.log("🔍 Typing indicator - userProfile?.id:", userProfile?.id);

    if (otherTypingUsers.length === 0) {
      console.log("🔍 Typing indicator - No other typing users found");
      return null;
    }

    // Get names for typing users
    const otherTypingUserNames = otherTypingUsers.map(typingUser => {
      console.log("🔍 Typing indicator - Processing typingUser:", typingUser);

      // Use stored userName if available
      if (typingUser.userName && typingUser.userName !== 'Someone') {
        console.log("🔍 Typing indicator - Using stored userName:", typingUser.userName);
        return typingUser.userName;
      }

      // Second priority: Get from participantsinConv (route params - most reliable)
      if (participantsinConv && Array.isArray(participantsinConv)) {
        // Search in participantsinConv

        // Let's try all possible ID fields with more detailed matching
        const participant = participantsinConv.find(
          (p: any) => String(p.id || p.userId || p.user?.id) === String(typingUser.userId)
        );

        if (participant) {
          const user = (participant as any).user || participant;
          const name = user.name || user.userName || user.firstName || user.displayName;
          console.log("🔍 Typing indicator - Found name in participantsinConv:", name);
          return name;
        }
      }

      // Try API conversation participants
      if (apiConversation?.participants) {
        const participant = apiConversation.participants.find(
          (p: any) => String(p.id || p.userId || p.user?.id) === String(typingUser.userId)
        );

        if (participant) {
          const user = (participant as any).user || participant;
          const name = user.userName || user.firstName || user.name || user.displayName;
          console.log("🔍 Typing indicator - Found name in apiConversation:", name);
          return name;
        }
      }

      // Third priority: Try to get from selected participant
      if (selectedParticipant && String(selectedParticipant.id) === String(typingUser.userId)) {
        const name = selectedParticipant.userName || selectedParticipant.firstName;
        console.log("🔍 Typing indicator - Found name in selectedParticipant:", name);
        return name;
      }

      // Try otherParticipantId fallback
      if (otherParticipantId && String(otherParticipantId) === String(typingUser.userId)) {
        const name = selectedParticipant?.userName || selectedParticipant?.firstName;
        console.log("🔍 Typing indicator - Found name in otherParticipantId fallback:", name);
        return name;
      }

      // No name found, don't show "Someone"
      console.log("🔍 Typing indicator - No name found for typingUser:", typingUser.userId);
      return null;
    });

    // Filter out nulls and "Someone"
    const validNames = otherTypingUserNames.filter(name => name && name !== 'Someone');
    console.log("🔍 Typing indicator - otherTypingUserNames:", otherTypingUserNames);
    console.log("🔍 Typing indicator - validNames:", validNames);

    if (validNames.length === 0) {
      console.log("🔍 Typing indicator - No valid names found");
      return null;
    }

    // Remove duplicates
    const uniqueNames = [...new Set(validNames)];

    const getTypingText = () => {
      if (uniqueNames.length === 1) {
        return `${uniqueNames[0]} is typing...`;
      } else if (uniqueNames.length === 2) {
        return `${uniqueNames[0]} and ${uniqueNames[1]} are typing...`;
      } else {
        return `${uniqueNames[0]} and ${uniqueNames.length - 1} others are typing...`;
      }
    };

    console.log("🔍 Typing indicator - Rendering typing indicator with uniqueNames:", uniqueNames);
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <Text style={styles.typingText}>{getTypingText()}</Text>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      </View>
    );
  };


  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateContent}>
        <Text style={styles.emptyStateTitle}>Start a conversation</Text>
        <Text style={styles.emptyStateText}>
          Send a message to begin your chat in{" "}
          {apiConversation?.title || "this conversation"}
        </Text>
      </View>
    </View>
  );

  const renderAttachmentOptions = () => {
    if (!showAttachments) return null;

    return (
      <View style={styles.attachmentContainer}>
        <TouchableOpacity
          style={styles.attachmentOption}
          onPress={() => handleAttachment("image")}
        >
          <View
            style={[
              styles.attachmentIconContainer,
              { backgroundColor: "#4CAF50" + "30" },
            ]}
          >
            <ImageIcon size={24} color="#4CAF50" />
          </View>
          <Text style={styles.attachmentText}>{t("common.image")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.attachmentOption}
          onPress={() => handleAttachment("document")}
        >
          <View
            style={[
              styles.attachmentIconContainer,
              { backgroundColor: "#2196F3" + "30" },
            ]}
          >
            <File size={24} color="#2196F3" />
          </View>
          <Text style={styles.attachmentText}>
            {t("messages.messageTypes.documentText")}

          </Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={styles.attachmentOption}
          onPress={() => handleAttachment("location")}
        >
          <View
            style={[
              styles.attachmentIconContainer,
              { backgroundColor: "#F44336" + "30" },
            ]}
          >
            <MapPin size={24} color="#F44336" />
          </View>
          <Text style={styles.attachmentText}>
            {t("messages.messageTypes.location")}
          </Text>
        </TouchableOpacity> */}
      </View>
    );
  };

  if (!userProfile) {
    console.log(
      "Chat screen - showing loading state. UserProfile:",
      !!userProfile
    );
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.white, marginTop: 10 }}>
          Loading user profile...
        </Text>
      </View>
    );
  }
  // Remove old loading logic - now using skeleton loader
  // if (isLoadingConversation) {
  //   dispatch(presentLoader());
  //   console.log("Showing loading state");
  // } else {
  //   dispatch(dismissLoader());
  // }
  // if (isLoadingConversation) {
  //   console.log("Chat screen - showing loading state for conversation");
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <ActivityIndicator size="large" color={Colors.primary} />
  //       <Text style={{ color: Colors.white, marginTop: 10 }}>
  //         Loading conversation...
  //       </Text>
  //     </View>
  //   );
  // }

  if (conversationError) {
    console.log("Chat screen - showing error state:", conversationError);
    return (
      <View style={styles.loadingContainer}>
        <Text
          style={{ color: Colors.white, marginBottom: 10, textAlign: "center" }}
        >
          Error loading conversation
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {conversationError}
        </Text>

        {/* Debug info */}
        <Text
          style={{
            color: Colors.textSecondary,
            textAlign: "center",
            marginBottom: 10,
            fontSize: 12,
          }}
        >
          Debug Info:
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            textAlign: "center",
            marginBottom: 5,
            fontSize: 10,
          }}
        >
          Conversation ID: {conversationId}
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            textAlign: "center",
            marginBottom: 5,
            fontSize: 10,
          }}
        >
          User Profile: {userProfile ? "Loaded" : "Not loaded"}
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            textAlign: "center",
            marginBottom: 20,
            fontSize: 10,
          }}
        >
          API Conversation: {apiConversation ? "Loaded" : "Not loaded"}
        </Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={{
              backgroundColor: Colors.primary,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
              flex: 1,
            }}
            onPress={() => {
              console.log("Chat screen - Retry button pressed");
              setConversationError(null);
              setConversation(undefined);
              // The useEffect will trigger again when conversation changes
            }}
          >
            <Text style={{ color: Colors.white, textAlign: "center" }}>
              Retry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: Colors.textSecondary,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
              flex: 1,
            }}
            onPress={() => {
              console.log("Chat screen - Continue Anyway button pressed");
              setConversationError(null);
              // Create a basic conversation to continue
              const basicConversation: Conversation = {
                id: conversationId,
                participants: [userProfile?.id?.toString() || "1"],
                unreadCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages: [],
                lastMessage: undefined,
              };
              setConversation(basicConversation);
            }}
          >
            <Text style={{ color: Colors.white, textAlign: "center" }}>
              Continue Anyway
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // if (!conversation) {
  //   console.log('Chat screen - no conversation found');
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <Text style={{ color: Colors.white, marginTop: 10 }}>
  //         No conversation found
  //       </Text>
  //     </View>
  //   );
  // }
  const ParticipantAvatar = React.memo(({ profileImage }: { profileImage?: string }) => {
    const [error, setError] = useState(false);
    const [imageKey, setImageKey] = useState(0);

    // Reset error state only when profileImage changes
    useEffect(() => {
      if (profileImage) {
        setError(false);
        setImageKey(prev => prev + 1); // Force re-render with new image
      }
    }, [profileImage]);

    return (
      <Image
        key={imageKey} // Force re-render when image changes
        source={
          error || !profileImage
            ? require("../../../assets/dummyImage.png") // 👈 fallback dummy image
            : { uri: profileImage }
        }
        onError={() => {
          console.log('ParticipantAvatar - Image load error for:', profileImage);
          setError(true);
        }}
        onLoad={() => {
          console.log('ParticipantAvatar - Image loaded successfully:', profileImage);
          setError(false);
        }}
        style={styles.participantAvatarImage}
      />
    );
  });

  // Memoized online indicator to prevent flickering
  const OnlineIndicator = React.memo(() => (
    <View style={styles.onlineIndicator} />
  ));
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 20}
        enabled={true}
      >
        {/* Test button for typing indicator */}
        <View style={styles.header}>
          <TouchableOpacity
            style={{ paddingHorizontal: 10, paddingVertical: 10 }}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerProfile}
            onPress={() => {
              // Navigate to group details screen
              console.log("Navigate to group details:", conversationId);

              if (conversation && apiConversation) {
                (navigation as any).navigate("GroupDetailsScreen", {
                  conversation: apiConversation, // Use API conversation data which includes participants
                  participants: [], // Empty array since participants are in conversation.participants
                  title: conversationItem?.title || selectedParticipant?.userName,
                  createdDate: conversationItem.createdAt,
                  lastActivity: conversationItem.updatedAt,
                  conversationId: conversationId,
                });
              } else {
                // Fallback: Navigate with mock data for testing
                console.log(
                  "Chat screen - Using fallback data for GroupDetailsScreen"
                );
                (navigation as any).navigate("GroupDetailsScreen", {
                  conversation: apiConversation || {
                    id: conversationId,
                    title:
                      conversationItem?.title || selectedParticipant?.userName,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  participants: [], // Empty array will trigger fallback participants
                  title: conversationItem?.title || selectedParticipant?.userName,
                  createdDate:
                    apiConversation?.createdAt || new Date().toISOString(),
                  lastActivity:
                    apiConversation?.lastMessageAt ||
                    apiConversation?.updatedAt ||
                    new Date().toISOString(),
                });
              }
            }}
          >
            <View>
              <ParticipantAvatar
                profileImage={selectedParticipant?.profileImage}
              />

              {getOtherParticipantStatus?.isOnline && <OnlineIndicator />}
            </View>

            {/* {selectedParticipant?.profileImage ? (
            <Image
              source={{ uri: selectedParticipant.profileImage }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarText}>
                {selectedParticipant
                  ? (
                      selectedParticipant.firstName ||
                      selectedParticipant.userName ||
                      "?"
                    )
                      .charAt(0)
                      .toUpperCase()
                  : (apiConversation?.title || "?")
                      .charAt(0)
                      .toUpperCase()}
              </Text>
            </View>
          )} */}

            <View style={styles.headerInfo}>
              <View style={styles.headerNameContainer}>
                <Text style={styles.headerName}>
                  {selectedParticipant
                    ? `${selectedParticipant.userName || "User"}`
                    : conversationItem?.title ||
                    selectedParticipant?.userName ||
                    "User"}
                </Text>
                {/* {(() => {
                const participantStatus = getOtherParticipantStatus();
                if (participantStatus?.isOnline) {
                  return <View style={styles.onlineIndicator} />;
                }
                return null;
              })()} */}
              </View>
              <Text style={styles.headerStatus}>
                {getOtherParticipantStatus?.isOnline
                  ? "Online"
                  : getOtherParticipantStatus?.lastSeen || "Offline"}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={handleCallPress}>
              <Phone size={20} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerButton}>
              <MoreVertical size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.messagesContainer}>
          {isLoadingConversation ? (
            <MessageSkeleton count={8} />
          ) : (
            <FlatList
              inverted={getAllMessages().length > 0 ? true : false} // ← This is the key prop

              ref={flatListRef}
              data={getAllMessages()}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              // onContentSizeChange={() => {
              //   // Only auto-scroll if user is at bottom or it's a new message
              //   if (shouldAutoScroll && isUserAtBottom) {
              //     flatListRef.current?.scrollToEnd({ animated: true });
              //   }
              // }}
              onLayout={() => {
                // Only auto-scroll on initial load
                if (shouldAutoScroll) {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }
              }}
              ListEmptyComponent={renderEmptyState}
              onEndReached={loadMoreMessages}
              onEndReachedThreshold={0.1}
              ListHeaderComponent={
                <View>
                  {isLoadingMore ? (
                    <View style={styles.loadingMoreContainer}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.loadingMoreText}>
                        Loading more messages...
                      </Text>
                    </View>
                  ) : null}
                  {renderTypingIndicator()}
                </View>
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>

        {/* Scroll to Bottom Button */}
        {/* {!isUserAtBottom && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
        >
          <ArrowLeft
            size={20}
            color={Colors.white}
            style={{ transform: [{ rotate: "-90deg" }] }}
          />
        </TouchableOpacity>
      )} */}

        {renderAttachmentOptions()}

        {/* Image Selection Modal */}
        <Modal
          visible={showImageModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.imageModalContainer}>
              <View style={styles.imageModalHeader}>
                <Text style={styles.imageModalTitle}>Send Image</Text>
                <TouchableOpacity
                  onPress={() => setShowImageModal(false)}
                  style={styles.imageModalCloseButton}
                >
                  <Text style={styles.imageModalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.imagePreviewContainer}>
                {!!selectedImages.length && (
                  <View style={styles.multipleImagesContainer}>
                    {selectedImages.map((imageUri, index) => (
                      <View key={index} style={styles.imageItemContainer}>
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.multipleImagePreview}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => {
                            const newImages = selectedImages.filter((_, i) => i !== index);
                            setSelectedImages(newImages);
                          }}
                        >
                          <Text style={styles.removeImageText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* Add More Images Button */}
                    {selectedImages.length < 10 && (
                      <TouchableOpacity
                        style={styles.addMoreImageButton}
                        onPress={() => {
                          setShowImageModal(false);
                          setShowImagePicker(true);
                        }}
                      >
                        <Text style={styles.addMoreImageText}>+</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.imageTextInputContainer}>
                <TextInput
                  style={styles.imageTextInput}
                  placeholder="Add a caption (optional)"
                  value={imageText}
                  onChangeText={setImageText}
                  multiline
                  maxLength={500}
                />
              </View>

              <View style={styles.imageModalActions}>
                <TouchableOpacity
                  style={styles.imageModalCancelButton}
                  onPress={() => setShowImageModal(false)}
                  disabled={isUploadingImage}
                >
                  <Text style={styles.imageModalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.imageModalSendButton,
                    (isUploadingImage || selectedImages.length === 0) && styles.imageModalSendButtonDisabled,
                  ]}
                  onPress={handleSendMultipleImages}
                  disabled={selectedImages.length === 0}
                >
                  {isUploadingImage ? (
                    <View style={styles.imageModalLoadingContainer}>
                      <ActivityIndicator size="small" color={Colors.white} />
                      <Text style={styles.imageModalSendText}>Uploading...</Text>
                    </View>
                  ) : (
                    <Text style={styles.imageModalSendText}>
                      Send {selectedImages.length} Image{selectedImages.length > 1 ? 's' : ''}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Image Picker Bottom Sheet */}
        <Modal
          visible={showImagePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImagePicker(false)}
        >
          <View style={styles.bottomSheetOverlay}>
            <TouchableOpacity
              style={styles.bottomSheetBackdrop}
              activeOpacity={1}
              onPress={() => setShowImagePicker(false)}
            />
            <View style={styles.bottomSheetContainer}>
              {/* Handle bar */}
              <View style={styles.bottomSheetHandle} />

              {/* Header */}
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Select Image</Text>
              </View>

              {/* Options */}
              <View style={styles.bottomSheetContent}>
                <TouchableOpacity
                  style={styles.bottomSheetOption}
                  onPress={handleSelectFromGallery}
                >
                  <View style={styles.bottomSheetOptionIcon}>
                    <ImageIcon size={24} color="#4CAF50" />
                  </View>
                  <View style={styles.bottomSheetOptionTextContainer}>
                    <Text style={styles.bottomSheetOptionTitle}>Gallery</Text>
                    <Text style={styles.bottomSheetOptionSubtitle}>
                      Choose from photos
                    </Text>
                  </View>
                  <View style={styles.bottomSheetOptionArrow}>
                    <Text style={styles.bottomSheetArrowText}>›</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bottomSheetOption}
                  onPress={handleTakePhoto}
                >
                  <View style={styles.bottomSheetOptionIcon}>
                    <Camera size={24} color="#2196F3" />
                  </View>
                  <View style={styles.bottomSheetOptionTextContainer}>
                    <Text style={styles.bottomSheetOptionTitle}>Camera</Text>
                    <Text style={styles.bottomSheetOptionSubtitle}>
                      Take a photo
                    </Text>
                  </View>
                  <View style={styles.bottomSheetOptionArrow}>
                    <Text style={styles.bottomSheetArrowText}>›</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.bottomSheetCancelButton}
                onPress={() => setShowImagePicker(false)}
              >
                <Text style={styles.bottomSheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Full Screen Image Modal */}
        <Modal
          visible={showFullImageModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.fullImageModalOverlay}>
            <View style={styles.fullImageModalContainer}>
              {/* Header with close button */}
              <View style={styles.fullImageHeader}>
                {/* Show download button only for documents */}
                {!fullImageUrl && (
                  <TouchableOpacity
                    onPress={() => { downloadFile(docUrl, t) }}
                    style={styles.fullImageCloseButton}
                  >
                    <Download size={24} color={Colors.white} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={closeFullImageModal}
                  style={styles.fullImageCloseButton}
                >
                  <X size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.fullImageContent}>
                {fullImageUrl ? (
                  // Render Image component for images
                  <Image
                    source={{ uri: fullImageUrl }}
                    style={styles.fullImage}
                    resizeMode="contain"
                  />
                ) : (
                  // Render WebView component for documents
                  <WebView
                    source={{ uri: googleDocsUrl }}
                    style={styles.webview}
                    scalesPageToFit={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    allowsFullscreenVideo={true}
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Recording Indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingContent}>
              <Animated.View
                style={[
                  styles.recordingPulse,
                  {
                    opacity: pulseAnim,
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              />
              <Text style={styles.recordingText}>
                {isPaused ? 'Paused' : 'Recording...'}
              </Text>
              <Text style={styles.recordingDuration}>
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </Text>
              <TouchableOpacity
                style={styles.pauseButton}
                onPress={handlePauseResume}
              >
                {isPaused ? (
                  <Play size={16} color={Colors.white} />
                ) : (
                  <Pause size={16} color={Colors.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setShowAttachments(!showAttachments)}
          >
            {showAttachments ? (
              <X size={20} color={Colors.primary} />
            ) : (
              <Paperclip size={20} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>

          <View style={styles.textInputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textSecondary}
              value={message}
              onChangeText={handleInputChange}
              multiline
              maxLength={1000}
            />
          </View>

          {message.trim() ? (
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Send size={20} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, isRecording && styles.recordingButton]}
              onPress={handleRecordVoice}
            >
              <Mic size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export { ChatScreen };

/**
 * Message Screen
 * @format
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  Search,
  Phone,
  MessageCircle,
  Filter,
  CheckCheck,
  Check,
  Pin,
  BellOff,
  Archive,
  Clock,
} from "lucide-react-native";
import LinearGradient from "react-native-linear-gradient";
import FastImage from "react-native-fast-image";

//Screens
import { Colors } from "@app/styles";
import { useChatStore } from "@app/store/chatStore";
import { Conversation, MessageStatus } from "@app/types";
import { mockMerchants } from "@app/mocks/users";
import { useThemedStyle } from "@app/styles";
import { Routes } from "../../../navigator";
import { getStyles } from "./styles";
import { useTranslation } from "react-i18next";
import {
  fetchConversations as fetchApiConversations,
  fetchArchivedConversations as fetchApiArchivedConversations,
  archiveConversation as archiveConversationApi,
  unarchiveConversation as unarchiveConversationApi,
} from "@app/service";
import { useSelector } from "react-redux";
import {
  selectProfile,
} from "@app/module/common";
import { ConversationSkeleton } from "@app/components/SkeletonLoader";

function MessagesScreen() {
  const { t } = useTranslation();

  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const userProfile = useSelector(selectProfile);
  console.log("User profile from Redux:", userProfile);
  const {
    fetchConversations,
    fetchArchivedConversations,
    setActiveConversation,
    togglePinConversation,
    toggleMuteConversation,
    archiveConversation,
    unarchiveConversation,
    deleteConversation,
    searchConversations,
    onlineUsers,
    isUserOnline,
    getOnlineUser,
    getTypingUsers,
    setOnlineUsers,
  } = useChatStore();

  // Debug online users
  useEffect(() => {
    console.log("Messages - Online users in store:", onlineUsers);
  }, [onlineUsers]);
  // Removed dispatch as we're not using Redux loader anymore
  // Check socket connection and online users
  useEffect(() => {
    // Import socket service to check connection
    import("@app/service/socket-service").then(({ socketService }) => {
      console.log("Messages - Socket connected:", socketService.isSocketConnected());
      if (!socketService.isSocketConnected()) {
        console.log(
          "Messages - Socket not connected, attempting to connect..."
        );
        // Try to get token from Redux store
        const token = userProfile?.token;
        if (token) {
          socketService.connect(token);
        }
      } else {
        // If socket is connected but no online users, try to request them
        if (onlineUsers.length === 0) {
          console.log(
            "Messages - Socket connected but no online users, requesting..."
          );
          // You might want to emit a request for online users here
          // socketService.requestOnlineUsers();
        }
      }
    });
  }, [userProfile, onlineUsers]);

  // Handle socket events for new messages
  useEffect(() => {
    if (!userProfile) return;

    const setupSocketListeners = async () => {
      try {
        const { socketService } = await import("@app/service/socket-service");

        console.log(
          "🚨 Messages - Setting up socket listeners for new messages..."
        );
        console.log(
          "🚨 Messages - Socket connected:",
          socketService.isSocketConnected()
        );

        // Listen for new messages
        const handleNewMessage = (data: any) => {
          console.log("🚨 Messages - NEW MESSAGE RECEIVED IN MESSAGES SCREEN!");
          console.log("🚨 Messages - Message data:", data);
          console.log(
            "🚨 Messages - Event received at:",
            new Date().toISOString()
          );

          const conversationId = data.conversationId || data.conversation_id;
          const message = data;

          if (conversationId && message) {
            console.log(
              "🚨 Messages - Updating conversation:",
              conversationId,
              "with new message:",
              message.content
            );

            // Update the conversations array to show the new message
            setConversations((prev) => {
              const updated = prev.map((conv) => {
                if (conv.id === conversationId.toString()) {
                  console.log(
                    "🚨 Messages - Found matching conversation:",
                    conv.id
                  );
                  return {
                    ...conv,
                    lastMessage: {
                      id: message.id.toString(),
                      conversationId: message.conversationId.toString(),
                      senderId: message.senderUserId.toString(),
                      receiverId: "all",
                      type: message.messageType || "text",
                      content: message.content,
                      timestamp: message.sentAt || message.timestamp,
                      read: false, // Mark as unread
                      delivered: true,
                      status: "delivered" as any,
                    },
                    unreadCount: (conv.unreadCount || 0) + 1, // Increment unread count
                  };
                }
                return conv;
              });
              console.log(
                "🚨 Messages - Updated conversations with new message"
              );
              return updated;
            });

            // Also update archived conversations if the message is for an archived conversation
            setArchivedConversations((prev) => {
              const updated = prev.map((conv) => {
                if (conv.id === conversationId.toString()) {
                  console.log(
                    "🚨 Messages - Found matching archived conversation:",
                    conv.id
                  );
                  return {
                    ...conv,
                    lastMessage: {
                      id: message.id.toString(),
                      conversationId: message.conversationId.toString(),
                      senderId: message.senderUserId.toString(),
                      receiverId: "all",
                      type: message.messageType || "text",
                      content: message.content,
                      timestamp: message.sentAt || message.timestamp,
                      read: false,
                      delivered: true,
                      status: "delivered" as any,
                    },
                    unreadCount: (conv.unreadCount || 0) + 1,
                  };
                }
                return conv;
              });
              return updated;
            });
          }
        };

        // Set the callback for new messages
        socketService.setNewMessageCallback(handleNewMessage);
        console.log("🚨 Messages - Socket callback set up successfully");

        // Cleanup function
        return () => {
          socketService.removeNewMessageCallback();
          console.log("🚨 Messages - Socket callback cleaned up");
        };
      } catch (error) {
        console.error(
          "🚨 Messages - Error setting up socket listeners:",
          error
        );
      }
    };

    const cleanup = setupSocketListeners();

    return () => {
      if (cleanup) {
        cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
      }
    };
  }, [userProfile]);

  // Test function to add mock online users for testing
  const addTestOnlineUsers = () => {
    const testUsers = [
      {
        id: "5",
        name: "broker",
        avatar:
          "https://loadrider.s3.us-east-1.amazonaws.com/1758370329771-profile_1758370329003.jpg",
        lastSeen: new Date().toISOString(),
        isOnline: true,
        email: "broker@yopmail.com",
      },
      {
        id: "21",
        name: "Rajan carrier",
        avatar:
          "https://loadrider.s3.us-east-1.amazonaws.com/1758401436566-profile_1758401435964.jpg",
        lastSeen: new Date().toISOString(),
        isOnline: true,
        email: "carrier001@yopmail.com",
      },
    ];

    console.log("Messages - Adding test online users:", testUsers);
    setOnlineUsers(testUsers);
  };

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<
    Conversation[]
  >([]);

  // Debug conversations state changes
  useEffect(() => {
    console.log("Conversations state changed:", conversations.length);
  }, [conversations]);

  useEffect(() => {
    console.log(
      "Archived conversations state changed:",
      archivedConversations.length
    );
  }, [archivedConversations]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [showOptions, setShowOptions] = useState(false);

  // useEffect(() => {
  //   loadConversations()
  //   if (userProfile) {
  //     loadConversations();
  //   }
  //   else {
  //     setLoading(false);

  //   }
  // }, [userProfile]);

  useFocusEffect(
    useCallback(() => {
      console.log("Chat List screen - useFocusEffect triggered");

      if (userProfile) {
        loadConversations();
      } else {
        setLoading(false);
      }

      // optional cleanup when leaving the screen
      return () => {
        console.log("Chat List screen - unfocused");
      };
    }, [userProfile])
  );
  const loadConversations = async () => {
    if (!userProfile) {
      console.log("No user profile, skipping loadConversations");
      return;
    }

    console.log("Loading conversations for user:", userProfile.id);
    setLoading(true);

    try {
      // Fetch conversations from API
      const apiConversations = await fetchApiConversations(false); // exclude archived
      const apiArchivedConversations = await fetchApiArchivedConversations();
      console.log("Non-archived conversations:", apiConversations);
      console.log(
        "Non-archived conversations length:",
        apiConversations.length
      );
      console.log("Archived conversations:", apiArchivedConversations);
      console.log(
        "Archived conversations length:",
        apiArchivedConversations.length
      );

      // Convert API response to our Conversation type
      console.log("API conversations before conversion:", apiConversations);
      const convertedConversations: Conversation[] = apiConversations.map(
        convertApiConversation
      );
      const convertedArchivedConversations: Conversation[] =
        apiArchivedConversations.map(convertApiConversation);

      console.log("Converted conversations:", convertedConversations);
      console.log(
        "Converted archived conversations:",
        convertedArchivedConversations
      );

      setConversations(convertedConversations);
      setArchivedConversations(convertedArchivedConversations);

      console.log(
        "Conversations state set, length:",
        convertedConversations.length
      );
      console.log(
        "Archived conversations state set, length:",
        convertedArchivedConversations.length
      );
    } catch (error) {
      console.error("Error loading conversations from API:", error);
      // Fallback to empty arrays if API fails
      setConversations([]);
      setArchivedConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert API response to our Conversation type
  const convertApiConversation = (apiConv: any): Conversation => {
    console.log("Converting API conversation:", apiConv);

    const converted = {
      id: apiConv.id.toString(),
      participants: apiConv.participants.map((p: any) => p.id.toString()),
      unreadCount: 0, // API doesn't provide this, set to 0
      jobId: apiConv.jobId ? apiConv.jobId.toString() : undefined,
      createdAt: apiConv.createdAt,
      updatedAt: apiConv.lastMessageAt || apiConv.createdAt,
      messages: [], // Messages will be loaded separately if needed
      lastMessage: apiConv.lastMessage
        ? {
            id: apiConv.lastMessage.id.toString(),
            conversationId: apiConv.id.toString(),
            senderId: apiConv.lastMessage.senderUserId
              ? apiConv.lastMessage.senderUserId.toString()
              : "",
            receiverId: "", // Not provided in API, set to empty string
            type: apiConv.lastMessage.messageType || "text",
            content: apiConv.lastMessage.content,
            timestamp: apiConv.lastMessage.sentAt,
            read: true, // Assume read for now
            delivered: true, // Assume delivered for now
            status: "read" as MessageStatus,
            jobId: apiConv.jobId ? apiConv.jobId.toString() : undefined,
          }
        : undefined,
      pinned: false, // Not provided in API
      muted: false, // Not provided in API
      archived: apiConv.isArchived || false,
      // Add title field for display purposes
      title: apiConv.title || "Untitled Conversation",
      // Preserve full API data for access to participants and other fields
      apiData: apiConv,
    };

    console.log("Converted conversation:", converted);
    return converted;
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);

    if (!userProfile) {
      console.log("No user profile for search");
      return;
    }

    if (text.trim() === "") {
      loadConversations();
    } else {
      // Filter conversations based on search query
      const filteredConversations = conversations.filter((conv) => {
        // Search in conversation title or last message content
        const title = (conv as any).title || "";
        const lastMessageContent = conv.lastMessage?.content || "";
        const searchLower = text.toLowerCase();

        return (
          title.toLowerCase().includes(searchLower) ||
          lastMessageContent.toLowerCase().includes(searchLower)
        );
      });
      setConversations(filteredConversations);
    }
  };

  const handleConversationPress = (
    conversationId: string,
    conversationItem: any
  ) => {
    setActiveConversation(conversationId);

    // Extract participant data from the preserved API data
    let selectedParticipant = null;
    const apiData = (conversationItem as any).apiData;

    console.log("Messages - Full conversation item:", conversationItem);
    console.log("Messages - API data:", apiData);
    console.log("Messages - Chat type:", apiData?.chatType);
    console.log("Messages - Participants:", apiData?.participants);

    if (apiData?.chatType === "direct" && apiData?.participants) {
      // Find the other participant (not the current user)
      const otherParticipant = apiData.participants.find((participant: any) => {
        const user = participant.user || participant;
        return user.id?.toString() !== (userProfile?.id || 0).toString();
      });

      console.log("Messages - Other participant found:", otherParticipant);

      if (otherParticipant) {
        const user = otherParticipant.user || otherParticipant;
        selectedParticipant = {
          id: user.id?.toString() || "",
          userName: user.userName || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          profileImage: user.profileImage,
          phoneNumber: user.phoneNumber,
          phoneCountryCode: user.phoneCountryCode,
          role: otherParticipant.role || "member",
          isOnline: false, // Default since not available in API
          lastSeen: undefined,
        };

        console.log(
          "Messages - Selected participant created:",
          selectedParticipant
        );
      }
    }

    console.log("Messages - Navigating to chat with:", {
      conversationId,
      selectedParticipant,
      chatType: apiData?.chatType,
    });

    navigation.navigate(Routes.ChatScreen, {
      conversationId,
      conversationItem,
      selectedParticipant,
      participantsinConv: apiData?.participants,
    });
  };

  const handleLongPress = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setShowOptions(true);
  };

  const handlePinConversation = () => {
    if (selectedConversation) {
      togglePinConversation(selectedConversation);
      loadConversations();
      setShowOptions(false);
    }
  };

  const handleMuteConversation = () => {
    if (selectedConversation) {
      toggleMuteConversation(selectedConversation);
      loadConversations();
      setShowOptions(false);
    }
  };

  const handleArchiveConversation = async () => {
    if (selectedConversation) {
      try {
        console.log("Archiving conversation:", selectedConversation);
        await archiveConversationApi(selectedConversation);
        console.log("Conversation archived successfully");
        loadConversations(); // Reload to refresh the list
        setShowOptions(false);
      } catch (error) {
        console.error("Error archiving conversation:", error);
        // You might want to show an error message to the user here
      }
    }
  };

  const handleUnarchiveConversation = async () => {
    if (selectedConversation) {
      try {
        console.log("Unarchiving conversation:", selectedConversation);
        await unarchiveConversationApi(selectedConversation);
        console.log("Conversation unarchived successfully");
        loadConversations(); // Reload to refresh the list
        setShowOptions(false);
      } catch (error) {
        console.error("Error unarchiving conversation:", error);
        // You might want to show an error message to the user here
      }
    }
  };

  const handleDeleteConversation = () => {
    if (selectedConversation) {
      deleteConversation(selectedConversation);
      loadConversations();
      setShowOptions(false);
    }
  };

  const handleNewMessage = () => {
    navigation.navigate(Routes.CallHistoryScreen);
  };

  const handleCallHistory = () => {
    navigation.navigate(Routes.CallHistoryScreen);
  };

  const renderMessageStatus = (status?: MessageStatus) => {
    switch (status) {
      case "sent":
        return <Check size={14} color={Colors.textSecondary} />;
      case "delivered":
        return <CheckCheck size={14} color={Colors.textSecondary} />;
      case "read":
        return <CheckCheck size={14} color={Colors.primary} />;
      default:
        return <Clock size={14} color={Colors.textSecondary} />;
    }
  };

  // Get participant's online status
  const getParticipantOnlineStatus = (participantId: string) => {
    const onlineUser = getOnlineUser(participantId);
    const isOnline = onlineUser?.isOnline || false;

    console.log("Messages - Checking online status for user:", participantId, {
      onlineUser,
      isOnline,
    });

    return isOnline;
  };

  // Get participant's detailed status
  const getParticipantStatus = (participantId: string) => {
    const onlineUser = getOnlineUser(participantId);
    return {
      isOnline: onlineUser?.isOnline || false,
      lastSeen: onlineUser?.lastSeen,
      name: onlineUser?.name,
      avatar: onlineUser?.avatar,
    };
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    console.log("Rendering conversation item:", item.id, item);
    if (!userProfile) {
      console.log("No user profile, returning null");
      return null;
    }

    console.log("User profile ID:", userProfile.id);

    // Try to find the participant in the API data, fallback to mock data if needed
    let participantName = (item as any).title || "Unknown User";
    let participantImage = null;
    let otherParticipantId = null;

    // First try to get data from the preserved API data
    const apiData = (item as any).apiData;
    if (apiData?.chatType === "direct" && apiData?.participants) {
      const otherParticipant = apiData.participants.find((participant: any) => {
        const user = participant.user || participant;
        return user.id?.toString() !== (userProfile?.id || 0).toString();
      });

      if (otherParticipant) {
        const user = otherParticipant.user || otherParticipant;
        otherParticipantId = user.id?.toString();
        participantName =
          user.userName ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          "Unknown User";
        participantImage = user.profileImage;

        console.log("Messages - Using API participant data:", {
          name: participantName,
          image: participantImage,
          userId: otherParticipantId,
          user: user,
        });
      }
    } else {
      // Fallback to conversation participants if API data not available
      otherParticipantId = item.participants.find(
        (id) => id !== userProfile.id.toString()
      );

      if (otherParticipantId) {
        // Fallback to mock data if API data not available
        const merchant = mockMerchants.find((m) => m.id === otherParticipantId);
        if (merchant) {
          participantName = merchant.name;
          participantImage = merchant.avatar;

          console.log("Messages - Using mock participant data:", {
            name: participantName,
            image: participantImage,
            userId: otherParticipantId,
          });
        }
      }
    }

    // Component to handle image with error fallback
    const ParticipantAvatar = () => {
      const [imageError, setImageError] = useState(false);

      return (
        <View style={styles.avatarContainer}>
          <FastImage
            style={styles.avatar}
            source={
              imageError || !participantImage
                ? require("../../../assets/dummyImage.png")
                : { uri: participantImage, priority: FastImage.priority.normal }
            }
            onError={() => setImageError(true)}
          />

          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      );
    };

    const isUserLastSender =
      item.lastMessage?.senderId === userProfile.id.toString();

    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    };

    const getMessagePreview = () => {
      // Check if someone is typing in this conversation
      const typingUsers = getTypingUsers(item.id);
      console.log(
        "🔍 Messages - getMessagePreview called for conversation:",
        item.id
      );
      console.log("🔍 Messages - typingUsers:", typingUsers);
      console.log("🔍 Messages - userProfile.id:", userProfile?.id);

      if (typingUsers.length > 0) {
        // Filter out current user from display
        const otherTypingUsers = typingUsers.filter(
          (user) => String(user.userId) !== String(userProfile?.id)
        );
        console.log("🔍 Messages - otherTypingUsers:", otherTypingUsers);

        if (otherTypingUsers.length === 0) {
          console.log("🔍 Messages - No other typing users, returning empty");
          return "";
        }

        // Check if this is a group chat or direct chat using API data
        const apiData = (item as any).apiData;
        const isGroupChat = apiData?.chatType === "group";
        console.log(
          "🔍 Messages - isGroupChat:",
          isGroupChat,
          "chatType:",
          apiData?.chatType,
          "participants:",
          item.participants?.length
        );

        if (isGroupChat) {
          console.log("🔍 Messages - Processing group chat typing users");
          // For group chats, show user names using the EXACT same logic as chat screen
          const typingUserNames = otherTypingUsers.map((typingUser, index) => {
            console.log(
              `🔍 Messages - Processing typing user ${index}:`,
              typingUser
            );

            // First priority: Use stored userName if available (same as chat screen)
            if (typingUser.userName) {
              console.log(
                "🔍 Messages - Using stored userName:",
                typingUser.userName
              );
              return typingUser.userName;
            }

            // Second priority: Get from API data participants (same as chat screen)
            const apiData = (item as any).apiData;
            console.log("🔍 Messages - API data:", apiData);
            console.log(
              "🔍 Messages - API participants:",
              apiData?.participants
            );

            if (apiData?.participants) {
              console.log(
                "🔍 Messages - Searching in apiData.participants for typingUser.userId:",
                typingUser.userId
              );

              const participant = apiData.participants.find((p: any) => {
                const participantId = String(p.id || p.userId || p.user?.id);
                const typingUserId = String(typingUser.userId);
                console.log(
                  "🔍 Messages - Comparing participantId:",
                  participantId,
                  "with typingUserId:",
                  typingUserId
                );

                // Try multiple matching strategies (same as chat screen)
                const match1 = p.id === typingUserId;
                const match2 = p.userId === typingUserId;
                const match3 = p.user?.id === typingUserId;
                const match4 = String(p.id) === String(typingUserId);
                const match5 = String(p.userId) === String(typingUserId);
                const match6 = String(p.user?.id) === String(typingUserId);

                console.log("🔍 Messages - Match results:", {
                  match1,
                  match2,
                  match3,
                  match4,
                  match5,
                  match6,
                });

                return match1 || match2 || match3 || match4 || match5 || match6;
              });

              console.log(
                "🔍 Messages - Found participant in apiData:",
                participant
              );

              if (participant) {
                const user = (participant as any).user || participant;
                console.log("🔍 Messages - User object:", user);
                const userName =
                  user.userName ||
                  user.firstName ||
                  user.name ||
                  user.displayName;
                console.log(
                  "🔍 Messages - Extracted userName from apiData:",
                  userName
                );
                return userName || "Someone";
              }
            }

            // Third priority: Try to get from mock data (same as chat screen)
            const merchant = mockMerchants.find(
              (m) => String(m.id) === String(typingUser.userId)
            );
            console.log("🔍 Messages - Merchant lookup:", merchant);
            if (merchant) {
              console.log("🔍 Messages - Using merchant name:", merchant.name);
              return merchant.name || "Someone";
            }

            console.log("🔍 Messages - No name found, using 'Someone'");
            return "Someone";
          });

          console.log(
            "🔍 Messages - Final typing user names:",
            typingUserNames
          );

          // Use the same text formatting as chat screen
          let typingText = "";
          if (otherTypingUsers.length === 1) {
            typingText = `${typingUserNames[0]} is typing...`;
          } else if (otherTypingUsers.length === 2) {
            typingText = `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`;
          } else {
            typingText = `${typingUserNames[0]} and ${
              otherTypingUsers.length - 1
            } others are typing...`;
          }

          console.log("🔍 Messages - Final typing text:", typingText);
          return typingText;
        } else {
          console.log("🔍 Messages - Direct chat, showing generic typing");
          // For direct chats, just show "typing..."
          return "typing...";
        }
      }

      if (!item.lastMessage) return "";
      let messageType = item.lastMessage.type;

      if (
        messageType == "file" &&
        item.lastMessage.content?.includes("voice")
      ) {
        messageType = "voice";
      }
      if (
        messageType == "file" &&
        item.lastMessage.content?.includes("Document")
      ) {
        messageType = "document";
      }

      switch (messageType) {
        case "text":
          return item.lastMessage.content;
        case "image":
          return t("messages.messageTypes.photo");
        case "voice":
          return t("messages.messageTypes.voice");
        case "document":
          return (
            t("messages.messageTypes.document") + " " + item.lastMessage.content
          );
        case "location":
          return t("messages.messageTypes.location");
        case "system":
          return item.lastMessage.content;
        default:
          return "";
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          item.pinned && styles.pinnedConversation,
        ]}
        onPress={() => handleConversationPress(item.id, item)}
        onLongPress={() => handleLongPress(item.id)}
        activeOpacity={0.7}
      >
        <View>
          <ParticipantAvatar />

          {(() => {
            const isOnline = getParticipantOnlineStatus(otherParticipantId);
            console.log(
              "Messages - Rendering status for user:",
              otherParticipantId,
              "isOnline:",
              isOnline
            );
            return (
              <View
                style={[
                  styles.statusIndicator,
                  isOnline ? styles.onlineIndicator : styles.offlineIndicator,
                ]}
              />
            );
          })()}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.conversationNameContainer}>
              <Text style={styles.conversationName} numberOfLines={1}>
                {participantName}
              </Text>
              {/* {otherParticipantId && (
                <View style={styles.statusContainer}>
                  {(() => {
                    const isOnline =
                      getParticipantOnlineStatus(otherParticipantId);
                    console.log(
                      "Messages - Rendering status for user:",
                      otherParticipantId,
                      "isOnline:",
                      isOnline
                    );
                    return (
                      <>
                        <View
                          style={[
                            styles.statusIndicator,
                            isOnline
                              ? styles.onlineIndicator
                              : styles.offlineIndicator,
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusLabel,
                            isOnline ? styles.onlineLabel : styles.offlineLabel,
                          ]}
                        >
                          {isOnline ? "Online" : "Offline"}
                        </Text>
                      </>
                    );
                  })()}
                </View>
              )} */}
            </View>
            <View style={styles.conversationMeta}>
              {item.pinned && (
                <Pin size={12} color={Colors.primary} style={styles.metaIcon} />
              )}
              {item.muted && (
                <BellOff
                  size={12}
                  color={Colors.textSecondary}
                  style={styles.metaIcon}
                />
              )}
              <Text style={styles.timeText}>
                {item.lastMessage ? formatTime(item.lastMessage.timestamp) : ""}
              </Text>
            </View>
          </View>

          <View style={styles.messagePreviewContainer}>
            <Text
              style={[
                styles.messagePreview,
                item.unreadCount > 0 && styles.unreadMessage,
                getMessagePreview().includes("typing") && styles.typingMessage,
              ]}
              numberOfLines={1}
            >
              {getMessagePreview()}
            </Text>

            {isUserLastSender && item.lastMessage && (
              <View style={styles.messageStatus}>
                {renderMessageStatus(item.lastMessage.status)}
              </View>
            )}
          </View>

          {item.jobId && (
            <View style={styles.jobTag}>
              <Text style={styles.jobTagText}>
                Job #{item.jobId.replace("j", "")}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderOptionsModal = () => {
    if (!showOptions || !selectedConversation) return null;

    const conversation = [...conversations, ...archivedConversations].find(
      (conv) => conv.id === selectedConversation
    );
    console.log("Conversation: ddddw", conversation);

    if (!conversation) return null;

    return (
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackground}
          onPress={() => setShowOptions(false)}
          activeOpacity={1}
        />

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={handlePinConversation}
          >
            <Pin size={20} color={Colors.white} />
            <Text style={styles.optionText}>
              {conversation.pinned
                ? t("messages.options.unpin")
                : t("messages.options.pin")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={handleMuteConversation}
          >
            <BellOff size={20} color={Colors.white} />
            <Text style={styles.optionText}>
              {conversation.muted
                ? t("messages.options.unmute")
                : t("messages.options.mute")}
            </Text>
          </TouchableOpacity>

          {showArchived ? (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleArchiveConversation}
            >
              <Archive size={20} color={Colors.white} />
              <Text style={styles.optionText}>
                {t("messages.options.unarchive")}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleArchiveConversation}
            >
              <Archive size={20} color={Colors.white} />
              <Text style={styles.optionText}>
                {t("messages.options.archive")}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.optionItem, styles.deleteOption]}
            onPress={handleDeleteConversation}
          >
            <Text style={[styles.optionText, styles.deleteText]}>
              {t("messages.options.delete")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    console.log("Rendering empty state - showArchived:", showArchived);
    console.log(
      "Rendering empty state - conversations length:",
      conversations.length
    );
    console.log(
      "Rendering empty state - archivedConversations length:",
      archivedConversations.length
    );

    return (
      <View style={styles.emptyContainer}>
        <MessageCircle size={60} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>
          {showArchived
            ? t("messages.noArchivedDesc")
            : t("messages.noMessages")}
        </Text>
        {/* <Text style={styles.emptyText}>
          {showArchived
            ? t("messages.noArchivedDesc")
            : t("messages.noMessagesDesc")}
        </Text> */}

        {/* {!showArchived && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleNewMessage}
          >
            <Text style={styles.emptyButtonText}>
              {t("messages.startNewMessage")}
            </Text>
          </TouchableOpacity>
        )} */}
      </View>
    );
  };

  // Remove old loading logic - now using skeleton loader
  // if (loading == true) {
  //   dispatch(presentLoader());
  //   console.log("Showing loading state");
  // } else {
  //   dispatch(dismissLoader());
  // }

  console.log(
    "Rendering main component - loading:",
    loading,
    "conversations:",
    conversations.length,
    "archived:",
    archivedConversations.length
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t("navigation.messages")}</Text>

          <View style={styles.headerActions}>
           

            {/* <TouchableOpacity
              style={styles.headerButton}
              onPress={handleNewMessage}
            >
              <MessageCircle size={20} color={Colors.white} />
            </TouchableOpacity> */}
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color={Colors.textSecondary} />
            <TextInput
              placeholder={t("messages.searchPlaceholder")}
              style={styles.searchInput}
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {/* <TouchableOpacity style={styles.filterButton}>
            <Filter size={18} color={Colors.white} />
          </TouchableOpacity> */}
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, !showArchived && styles.activeTab]}
            onPress={() => setShowArchived(false)}
          >
            <Text
              style={[styles.tabText, !showArchived && styles.activeTabText]}
            >
              {t("messages.chats")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, showArchived && styles.activeTab]}
            onPress={() => setShowArchived(true)}
          >
            <Text
              style={[styles.tabText, showArchived && styles.activeTabText]}
            >
              {t("messages.archived")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ConversationSkeleton count={6} />
      ) : (
        <FlatList
          data={showArchived ? archivedConversations : conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.conversationsList}
          ListEmptyComponent={renderEmptyState}
          onLayout={() => {
            console.log("FlatList onLayout - showArchived:", showArchived);
            console.log(
              "FlatList onLayout - conversations length:",
              conversations.length
            );
            console.log(
              "FlatList onLayout - archivedConversations length:",
              archivedConversations.length
            );
            console.log(
              "FlatList onLayout - data length:",
              (showArchived ? archivedConversations : conversations).length
            );
            console.log(
              "FlatList onLayout - data:",
              showArchived ? archivedConversations : conversations
            );
          }}
        />
      )}

      {renderOptionsModal()}
    </View>
  );
}

export { MessagesScreen };

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectProfile } from "@app/module/common";
import { getStyles } from "./styles";
import { Conversation } from "@app/types";
import { Colors, useThemedStyle } from "@app/styles";
import moment from "moment";
import { createDirectConversation, fetchConversationDetails, ConversationResponse } from "@app/service/conversations-service";

type RootStackParamList = {
  GroupDetailsScreen: {
    conversationId?: string;
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
    title?: string;
    createdDate?: string;
    lastActivity?: string;
  };
};

type GroupDetailsRouteProp = RouteProp<
  RootStackParamList,
  "GroupDetailsScreen"
>;

const ParticipantAvatar = ({ profileImage, styles }: { profileImage?: string; styles: any }) => {
  const [error, setError] = useState(false);

  return (
    <Image
      source={
        error || !profileImage
          ? require("../../../assets/dummyImage.png") // 👈 fallback dummy image
          : { uri: profileImage }
      }
      onError={() => setError(true)}
      style={styles.participantAvatarImage}
    />
  );
};

const GroupDetailsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<GroupDetailsRouteProp>();
  const userProfile = useSelector(selectProfile);
  const styles = useThemedStyle(getStyles);

  const {conversationId , conversation, participants, title, createdDate, lastActivity } =
    route.params || {};
console.log("GroupDetailsScreen - conversation: route.params", route.params);
  // State for API data
  const [conversationData, setConversationData] = useState<ConversationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
console.log("GroupDetailsScreen - conversation: particpent", conversationData);
  // Fetch conversation details from API
  useEffect(() => {
    const fetchConversationData = async () => {
      if (!conversationId) {
        console.log("No conversation ID provided, skipping API call");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching conversation details for ID:", conversationId);
        const data = await fetchConversationDetails(conversationId.toString());
        setConversationData(data);
        console.log("Conversation details fetched successfully:", data);
      } catch (err) {
        console.error("Error fetching conversation details:", err);
        setError(err?.message || "Failed to fetch conversation details");
      } finally {
        setLoading(false);
      }
    };

    fetchConversationData();
  }, [conversationId]);

  console.log("GroupDetailsScreen - conversation:", conversation);
  console.log("GroupDetailsScreen - conversation title:", (conversation as any)?.title);
  console.log("GroupDetailsScreen - passed title:", title);
  console.log("GroupDetailsScreen - passed createdDate:", createdDate);
  console.log("GroupDetailsScreen - passed lastActivity:", lastActivity);
  console.log(
    "GroupDetailsScreen - conversation keys:",
    conversation ? Object.keys(conversation) : "No conversation"
  );
  console.log("GroupDetailsScreen - participants (from params):", participants);
  console.log(
    "GroupDetailsScreen - participants length (from params):",
    participants?.length
  );
  console.log(
    "GroupDetailsScreen - conversation.participants:",
    conversation?.participants
  );
  console.log(
    "GroupDetailsScreen - conversation.participants length:",
    conversation?.participants?.length
  );

  // Get participants from API data, fallback to passed data, then to dummy data
  const getDisplayParticipants = () => {
    // First priority: API data
    if (conversationData?.participants && conversationData.participants.length > 0) {
      console.log("✅ GroupDetailsScreen - Using API participants data");
      console.log("GroupDetailsScreen - API participants raw data:", conversationData.participants);
      
      return conversationData.participants.map((participant: any) => {
        // Extract user data from nested structure
        const user = participant.user || participant;
        console.log("GroupDetailsScreen - Processing participant:", participant);
        console.log("GroupDetailsScreen - User data:", user);
        
        return {
          id: user.id?.toString() || participant.id?.toString() || "",
          userName: user.userName || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          profileImage: user.profileImage,
          phoneNumber: user.phoneNumber || "00000 00000",
          phoneCountryCode: user.phoneCountryCode || "+91",
          role: participant.role || "member", // Use role from participant if available
          isOnline: false, // Default to false since this property doesn't exist in API
          lastSeen: undefined, // Default to undefined since this property doesn't exist in API
        };
      });
    }

    // Second priority: passed participants
    if (participants && participants.length > 0) {
      console.log("⚠️ GroupDetailsScreen - Using passed participants data (fallback)");
      return participants.map((participant: any) => ({
        id: participant.id.toString(),
        userName: participant.userName || "",
        firstName: participant.firstName || "",
        lastName: participant.lastName || "",
        profileImage: participant.profileImage,
        phoneNumber: participant.phoneNumber || "00000 00000",
        phoneCountryCode: participant.phoneCountryCode || "+91",
        role: "member",
        isOnline: false,
        lastSeen: undefined,
      }));
    }

    // Third priority: conversation participants (if available)
    if (conversation?.participants && conversation.participants.length > 0) {
      console.log("⚠️ GroupDetailsScreen - Using conversation participants data (fallback)");
      return conversation.participants.map((participant: any) => ({
        id: participant.id.toString(),
        userName: participant.userName || "",
        firstName: participant.firstName || "",
        lastName: participant.lastName || "",
        profileImage: participant.profileImage,
        phoneNumber: participant.phoneNumber || "00000 00000",
        phoneCountryCode: participant.phoneCountryCode || "+91",
        role: "member",
        isOnline: false,
        lastSeen: undefined,
      }));
    }

    // Fallback: dummy participants (only if no real data available)
    console.log("❌ GroupDetailsScreen - Using dummy participants data (no real data available)");
    return [
      {
        id: userProfile?.id?.toString() || "1",
        userName: userProfile?.userName || "pavanvjvrg",
        firstName: userProfile?.firstName || "Pavan",
        lastName: userProfile?.lastName || "VJ",
        profileImage: userProfile?.profileImage,
        phoneNumber: userProfile?.phoneNumber || "97113 79471",
        phoneCountryCode: "+91",
        role: "admin",
        isOnline: true,
      },
      {
        id: "2",
        userName: "driver1 dummy",
        firstName: "John",
        lastName: "Driver",
        profileImage: undefined,
        phoneNumber: "98765 43210",
        phoneCountryCode: "+91",
        role: "member",
        isOnline: false,
      },
      {
        id: "3",
        userName: "merchant1",
        firstName: "Jane",
        lastName: "Merchant",
        profileImage: undefined,
        phoneNumber: "87654 32109",
        phoneCountryCode: "+91",
        role: "member",
        isOnline: true,
      },
      {
        id: "4",
        userName: "logistics1",
        firstName: "Mike",
        lastName: "Logistics",
        profileImage: undefined,
        phoneNumber: "76543 21098",
        phoneCountryCode: "+91",
        role: "member",
        isOnline: false,
      },
    ];
  };

  const displayParticipants = getDisplayParticipants();

  console.log(
    "GroupDetailsScreen - Final displayParticipants:",
    displayParticipants
  );
  console.log(
    "GroupDetailsScreen - displayParticipants length:",
    displayParticipants.length
  );
  console.log(
    "GroupDetailsScreen - conversationData exists:",
    !!conversationData
  );
  console.log(
    "GroupDetailsScreen - conversationData.participants:",
    conversationData?.participants
  );
  console.log(
    "GroupDetailsScreen - displayParticipants type:",
    typeof displayParticipants
  );
  console.log(
    "GroupDetailsScreen - displayParticipants is array:",
    Array.isArray(displayParticipants)
  );
  console.log(
    "GroupDetailsScreen - First participant phoneCountryCode:",
    displayParticipants[0]?.phoneCountryCode
  );
  console.log(
    "GroupDetailsScreen - First participant phoneNumber:",
    displayParticipants[0]?.phoneNumber
  );


  const handleBack = () => {
    navigation.goBack();
  };

  const handleParticipantPress = async (participant: any) => {
    console.log("Navigate to chat with participant:", participant.id);
    console.log("Current conversation ID:", conversationId);

    // Check if it's the current user
    const isCurrentUser = participant.id === userProfile?.id?.toString();

    if (isCurrentUser) {
      console.log("Cannot start chat with yourself");
      Alert.alert(t("common.info"), t("common.cannotStartChatWithYourself"));
      return;
    }

    try {
      console.log("Creating direct conversation with user:", participant.id);
      
      // Convert participant ID to number for API call
      const receiverUserId = parseInt(participant.id, 10);
      
      if (isNaN(receiverUserId)) {
        throw new Error("Invalid participant ID");
      }

      // Call the API to create a direct conversation
      const newConversation = await createDirectConversation(receiverUserId);
      
      console.log("Direct conversation created successfully:", newConversation);
      console.log("New conversation ID:", newConversation.id);

      // Navigate to chat screen with the new conversation
      (navigation as any).navigate("ChatScreen", {
        conversationId: newConversation.id.toString(),
        selectedParticipant: participant,
        conversation: newConversation,
      });
      
    } catch (error) {
      console.error("Error creating direct conversation:", error);
      
      // Show error message to user
      Alert.alert(
        t("common.error"), 
        error?.message || t("common.failedToStartChat") || "Failed to start chat. Please try again.",
        [{ text: t("common.ok") }]
      );
    }
  };

  const renderParticipant = ({ item }: { item: any }) => {
    console.log(
      "GroupDetailsScreen - renderParticipant called with item:",
      item
    );
    const isCurrentUser = item.id === userProfile?.id?.toString();
    return (
      <TouchableOpacity
        style={[
          styles.participantItem,
          isCurrentUser && styles.participantItemDisabled,
        ]}
        onPress={() => handleParticipantPress(item)}
        disabled={isCurrentUser}
        activeOpacity={isCurrentUser ? 1 : 0.7}
      >
        <View style={styles.participantAvatar}>
          <ParticipantAvatar profileImage={item.profileImage} styles={styles} />
        </View>

        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>
            {item.userName || item.firstName || "user"}
          </Text>
          <Text style={styles.participantPhone}>
            {item?.phoneCountryCode} {item.phoneNumber}
          </Text>
        </View>

        <View style={styles.participantRight}>
          <Text style={styles.participantActionText}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.groupDetailsHeader}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Group Details</Text>
        <Text style={styles.headerSubtitle}>
          {displayParticipants.length} participants
        </Text>
      </View>
    </View>
  );

  const renderGroupInfo = () => {
    // Use API data first, then fallback to passed data
    const groupTitle = conversationData?.title || title || (conversation as any)?.title || "Group Chat";
    const groupCreatedDate = conversationData?.createdAt || createdDate;
    const groupLastActivity = conversationData?.lastMessageAt || lastActivity;
    
    console.log("GroupDetailsScreen - Group info from API:", {
      title: conversationData?.title,
      createdAt: conversationData?.createdAt,
      lastMessageAt: conversationData?.lastMessageAt
    });

    return (
      <View style={styles.groupInfoSection}>
        <View style={styles.groupInfoItem}>
          <Text style={styles.groupInfoLabel}>Group Name</Text>
          <Text style={styles.groupInfoValue}>
            {groupTitle}
          </Text>
        </View>

        <View style={styles.groupInfoItem}>
          <Text style={styles.groupInfoLabel}>Created</Text>
          <Text style={styles.groupInfoValue}>
            {groupCreatedDate ? moment(groupCreatedDate).format("DD/MM/YYYY HH:mm A") : "N/A"}
          </Text>
        </View>

        <View style={styles.groupInfoItem}>
          <Text style={styles.groupInfoLabel}>Last Activity</Text>
          <Text style={styles.groupInfoValue}>
            {groupLastActivity ? moment(groupLastActivity).format("DD/MM/YYYY HH:mm A") : "N/A"}
          </Text>
        </View>
      </View>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        {renderHeader()}
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.groupInfoValue, { marginTop: 16 }]}>Loading participants...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        {renderHeader()}
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[styles.groupInfoValue, { color: 'red', textAlign: 'center' }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={{ marginTop: 16, padding: 12, backgroundColor: Colors.primary, borderRadius: 8 }}
            onPress={() => {
              if (conversationId) {
                setError(null);
                setLoading(true);
                fetchConversationDetails(conversation.id.toString())
                  .then(setConversationData)
                  .catch((err) => setError(err?.message || "Failed to fetch conversation details"))
                  .finally(() => setLoading(false));
              }
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {renderHeader()}

      <View style={styles.groupInfoSection}>{renderGroupInfo()}</View>
      <ScrollView
        style={styles.participantsList}
        contentContainerStyle={styles.participantsContent}
      >
        {displayParticipants?.map((item, index) => {
          console.log(
            "GroupDetailsScreen - ScrollView rendering item:",
            item,
            "index:",
            index
          );
          return <View key={item.id}>{renderParticipant({ item })}</View>;
        })}
      </ScrollView>
    </View>
  );
};

export default GroupDetailsScreen;

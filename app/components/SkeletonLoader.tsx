/**
 * Skeleton Loader Component
 * @format
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '@app/styles';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.skeletonBase, Colors.skeletonHighlight],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

interface ConversationSkeletonProps {
  count?: number;
}

export const ConversationSkeleton: React.FC<ConversationSkeletonProps> = ({
  count = 5,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.conversationItem}>
          {/* Avatar skeleton */}
          <View style={styles.avatarContainer}>
            <SkeletonLoader width={50} height={50} borderRadius={25} />
          </View>

          {/* Content skeleton */}
          <View style={styles.contentContainer}>
            {/* Header skeleton */}
            <View style={styles.headerContainer}>
              <SkeletonLoader width="60%" height={16} borderRadius={4} />
              <SkeletonLoader width="20%" height={12} borderRadius={4} />
            </View>

            {/* Message preview skeleton */}
            <View style={styles.messageContainer}>
              <SkeletonLoader width="80%" height={14} borderRadius={4} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

interface HomeScreenSkeletonProps {
  userRole?: string;
}

export const HomeScreenSkeleton: React.FC<HomeScreenSkeletonProps> = ({
  userRole = "driver",
}) => {
  return (
    <View style={styles.homeContainer}>
      {/* Header skeleton */}
      <View style={styles.homeHeader}>
        {/* Profile card skeleton */}
        <View style={styles.profileCardSkeleton}>
          <SkeletonLoader width={50} height={50} borderRadius={25} />
          <View style={styles.profileTextContainer}>
            <SkeletonLoader width="80%" height={16} borderRadius={4} />
            <SkeletonLoader width="60%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>
        
        {/* Location card skeleton */}
        <View style={styles.locationCardSkeleton}>
          <SkeletonLoader width={50} height={50} borderRadius={25} />
          <View style={styles.locationTextContainer}>
            <SkeletonLoader width="70%" height={16} borderRadius={4} />
            <SkeletonLoader width="90%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>

      {/* Job invitations skeleton (if applicable) */}
      {userRole !== "shipper" && (
        <View style={styles.jobInvitationsSkeleton}>
          <View style={styles.jobInvitationsContent}>
            <View style={styles.jobInvitationsLeft}>
              <SkeletonLoader width={40} height={40} borderRadius={20} />
              <View style={styles.jobInvitationsTextContainer}>
                <SkeletonLoader width="60%" height={16} borderRadius={4} />
                <SkeletonLoader width="80%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
            </View>
            <SkeletonLoader width={20} height={20} borderRadius={10} />
          </View>
        </View>
      )}

      {/* Action buttons skeleton (for merchant/carrier roles) */}
      {(userRole === "merchant" || userRole === "carrier" || userRole === "broker") && (
        <View style={styles.actionButtonsSkeleton}>
          <SkeletonLoader width="100%" height={50} borderRadius={8} />
          <SkeletonLoader width="100%" height={50} borderRadius={8} style={{ marginTop: 12 }} />
        </View>
      )}

      {/* Search bar skeleton (for driver/carrier roles) */}
      {(userRole === "driver" || userRole === "carrier" || userRole === "broker") && (
        <View style={styles.searchContainerSkeleton}>
          <SkeletonLoader width="85%" height={50} borderRadius={8} />
          <SkeletonLoader width={50} height={50} borderRadius={8} />
        </View>
      )}

      {/* Stats container skeleton */}
      <View style={styles.statsContainerSkeleton}>
        <View style={styles.statCardSkeleton}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <SkeletonLoader width="60%" height={20} borderRadius={4} style={{ marginTop: 8 }} />
          <SkeletonLoader width="80%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.statCardSkeleton}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <SkeletonLoader width="60%" height={20} borderRadius={4} style={{ marginTop: 8 }} />
          <SkeletonLoader width="80%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.statCardSkeleton}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <SkeletonLoader width="60%" height={20} borderRadius={4} style={{ marginTop: 8 }} />
          <SkeletonLoader width="80%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* Active jobs section skeleton */}
      <View style={styles.sectionSkeleton}>
        <View style={styles.sectionHeaderSkeleton}>
          <SkeletonLoader width="40%" height={18} borderRadius={4} />
          <SkeletonLoader width="20%" height={16} borderRadius={4} />
        </View>
        
        {/* Job cards skeleton */}
        {Array.from({ length: 3 }, (_, index) => (
          <View key={index} style={styles.jobCardSkeleton}>
            <View style={styles.jobCardHeader}>
              <SkeletonLoader width="70%" height={16} borderRadius={4} />
              <SkeletonLoader width="20%" height={14} borderRadius={4} />
            </View>
            <SkeletonLoader width="90%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
            <SkeletonLoader width="60%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
            <View style={styles.jobCardFooter}>
              <SkeletonLoader width="30%" height={12} borderRadius={4} />
              <SkeletonLoader width="25%" height={12} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>

      {/* Recent jobs section skeleton (for driver/carrier roles) */}
      {(userRole === "driver" || userRole === "carrier" || userRole === "broker") && (
        <View style={styles.sectionSkeleton}>
          <View style={styles.sectionHeaderSkeleton}>
            <SkeletonLoader width="35%" height={18} borderRadius={4} />
            <SkeletonLoader width="20%" height={16} borderRadius={4} />
          </View>
          
          {/* Job cards skeleton */}
          {Array.from({ length: 2 }, (_, index) => (
            <View key={index} style={styles.jobCardSkeleton}>
              <View style={styles.jobCardHeader}>
                <SkeletonLoader width="70%" height={16} borderRadius={4} />
                <SkeletonLoader width="20%" height={14} borderRadius={4} />
              </View>
              <SkeletonLoader width="90%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
              <SkeletonLoader width="60%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
              <View style={styles.jobCardFooter}>
                <SkeletonLoader width="30%" height={12} borderRadius={4} />
                <SkeletonLoader width="25%" height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick actions section skeleton (for merchant/carrier roles) */}
      {(userRole === "merchant" || userRole === "carrier" || userRole === "broker") && (
        <View style={styles.sectionSkeleton}>
          <SkeletonLoader width="40%" height={18} borderRadius={4} />
          
          {/* Quick action items skeleton */}
          {Array.from({ length: 2 }, (_, index) => (
            <View key={index} style={styles.quickActionSkeleton}>
              <SkeletonLoader width={40} height={40} borderRadius={20} />
              <View style={styles.quickActionContentSkeleton}>
                <SkeletonLoader width="60%" height={16} borderRadius={4} />
                <SkeletonLoader width="80%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
              <SkeletonLoader width={20} height={20} borderRadius={10} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

interface MessageSkeletonProps {
  count?: number;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({
  count = 8,
}) => {
  return (
    <View style={styles.messagesContainer}>
      {Array.from({ length: count }, (_, index) => {
        // Alternate between user and other messages
        const isUser = index % 3 === 0; // Every 3rd message is user's
        
        return (
          <View key={index} style={[
            styles.messageItem,
            isUser ? styles.userMessageItem : styles.otherMessageItem
          ]}>
            {/* Avatar skeleton for other messages */}
            {!isUser && (
              <View style={styles.messageAvatarContainer}>
                <SkeletonLoader width={32} height={32} borderRadius={16} />
              </View>
            )}
            
            <View style={[
              styles.messageBubble,
              isUser ? styles.userMessageBubble : styles.otherMessageBubble
            ]}>
              {/* Multiple message lines for more realism */}
              {(() => {
                // Use index for deterministic "randomness"
                const lineCount = (index % 3) + 1; // 1-3 lines
                const lines = [];
                
                for (let i = 0; i < lineCount; i++) {
                  const isLastLine = i === lineCount - 1;
                  const widthVariations = isUser 
                    ? ["65%", "80%", "45%", "70%", "55%"] 
                    : ["55%", "70%", "40%", "60%", "50%"];
                  
                  lines.push(
                    <SkeletonLoader 
                      key={i}
                      width={isLastLine ? widthVariations[index % widthVariations.length] : "90%"} 
                      height={16} 
                      borderRadius={8} 
                      style={{ marginBottom: i < lineCount - 1 ? 4 : 6 }}
                    />
                  );
                }
                return lines;
              })()}
              
              {/* Time and status skeleton */}
              <View style={styles.messageFooter}>
                <SkeletonLoader 
                  width="20%" 
                  height={10} 
                  borderRadius={4} 
                />
                {isUser && (
                  <SkeletonLoader 
                    width={12} 
                    height={10} 
                    borderRadius={6} 
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
            </View>
            
            {/* Spacer for user messages */}
            {isUser && <View style={styles.messageSpacer} />}
          </View>
        );
      })}
    </View>
  );
};

interface JobsScreenSkeletonProps {
  count?: number;
}

export const JobsScreenSkeleton: React.FC<JobsScreenSkeletonProps> = ({
  count = 6,
}) => {
  return (
    <View style={styles.jobsContainer}>
      {/* Header skeleton */}
      {/* <View style={styles.jobsHeader}>
        <SkeletonLoader width="100%" height={50} borderRadius={8} />
      </View> */}
      
      {/* Tabs skeleton */}
      {/* <View style={styles.jobsTabs}>
        <SkeletonLoader width="25%" height={40} borderRadius={20} style={{ marginRight: 12 }} />
        <SkeletonLoader width="20%" height={40} borderRadius={20} style={{ marginRight: 12 }} />
        <SkeletonLoader width="22%" height={40} borderRadius={20} style={{ marginRight: 12 }} />
        <SkeletonLoader width="25%" height={40} borderRadius={20} />
      </View> */}
      
      {/* Job cards skeleton */}
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.jobsJobCardSkeleton}>
          <View style={styles.jobsJobCardHeader}>
            <SkeletonLoader width="70%" height={18} borderRadius={4} />
            <SkeletonLoader width="20%" height={16} borderRadius={4} />
          </View>
          
          <SkeletonLoader width="90%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
          <SkeletonLoader width="60%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
          
          {/* Location skeleton */}
          <View style={styles.jobLocationSkeleton}>
            <SkeletonLoader width={16} height={16} borderRadius={8} />
            <SkeletonLoader width="40%" height={12} borderRadius={4} style={{ marginLeft: 8 }} />
          </View>
          
          <View style={styles.jobLocationSkeleton}>
            <SkeletonLoader width={16} height={16} borderRadius={8} />
            <SkeletonLoader width="45%" height={12} borderRadius={4} style={{ marginLeft: 8 }} />
          </View>
          
          {/* Job details skeleton */}
          <View style={styles.jobDetailsSkeleton}>
            <View style={styles.jobDetailItem}>
              <SkeletonLoader width={16} height={16} borderRadius={8} />
              <SkeletonLoader width="30%" height={12} borderRadius={4} style={{ marginLeft: 8 }} />
            </View>
            <View style={styles.jobDetailItem}>
              <SkeletonLoader width={16} height={16} borderRadius={8} />
              <SkeletonLoader width="25%" height={12} borderRadius={4} style={{ marginLeft: 8 }} />
            </View>
            <View style={styles.jobDetailItem}>
              <SkeletonLoader width={16} height={16} borderRadius={8} />
              <SkeletonLoader width="20%" height={12} borderRadius={4} style={{ marginLeft: 8 }} />
            </View>
          </View>
          
          {/* Payment and carrier info skeleton */}
          <View style={styles.jobFooterSkeleton}>
            <SkeletonLoader width="35%" height={16} borderRadius={4} />
            <SkeletonLoader width="25%" height={14} borderRadius={4} />
          </View>
          
          {/* Distance and time skeleton */}
          <View style={styles.jobFooterSkeleton}>
            <SkeletonLoader width="40%" height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
};

interface ProfileScreenSkeletonProps {
  userRole?: string;
}

export const ProfileScreenSkeleton: React.FC<ProfileScreenSkeletonProps> = ({
  userRole = "driver",
}) => {
  return (
    <View style={styles.profileContainer}>
      {/* Header */}
      <View style={styles.profileHeaderSkeleton}>
        <SkeletonLoader width={24} height={24} />
      </View>

      {/* Profile Header Section */}
      <View style={styles.profileHeaderSection}>
        <View style={styles.profileAvatarContainer}>
          <SkeletonLoader width={100} height={100} style={styles.profileAvatarSkeleton} />
          <SkeletonLoader width={32} height={32} style={styles.profileEditButtonSkeleton} />
        </View>
        
        <SkeletonLoader width={150} height={24} style={{ marginTop: 16 }} />
        <SkeletonLoader width={80} height={16} style={{ marginTop: 8 }} />
        <SkeletonLoader width={120} height={20} style={{ marginTop: 8 }} />
        <SkeletonLoader width={120} height={40} style={{ marginTop: 16 }} />
      </View>

      {/* Contact Section */}
      <View style={styles.profileContactSection}>
        <View style={styles.profileContactItem}>
          <SkeletonLoader width={20} height={20} />
          <SkeletonLoader width={120} height={16} />
        </View>
        <View style={styles.profileContactItem}>
          <SkeletonLoader width={20} height={20} />
          <SkeletonLoader width={150} height={16} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.profileTabsContainer}>
        <SkeletonLoader width={80} height={40} style={styles.profileTabSkeleton} />
        <SkeletonLoader width={100} height={40} style={styles.profileTabSkeleton} />
        <SkeletonLoader width={120} height={40} style={styles.profileTabSkeleton} />
      </View>

      {/* Profile Content */}
      <View style={styles.profileContentSection}>
        {/* Documents Section */}
        <View style={styles.profileSection}>
          <SkeletonLoader width={100} height={20} />
          {Array.from({ length: 3 }, (_, i) => i + 1).map((item) => (
            <View key={`profile-document-${item}`} style={styles.profileDocumentItem}>
              <SkeletonLoader width={20} height={20} />
              <View style={styles.profileDocumentInfo}>
                <SkeletonLoader width={120} height={16} />
                <SkeletonLoader width={80} height={14} style={{ marginTop: 4 }} />
              </View>
              <SkeletonLoader width={20} height={20} />
            </View>
          ))}
        </View>

        {/* Stats Section */}
        <View style={styles.profileSection}>
          <SkeletonLoader width={80} height={20} />
          <View style={styles.profileStatsContainer}>
            <View style={styles.profileStatItem}>
              <SkeletonLoader width={40} height={40} />
              <SkeletonLoader width={60} height={16} style={{ marginTop: 8 }} />
              <SkeletonLoader width={40} height={14} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.profileStatItem}>
              <SkeletonLoader width={40} height={40} />
              <SkeletonLoader width={60} height={16} style={{ marginTop: 8 }} />
              <SkeletonLoader width={40} height={14} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.profileStatItem}>
              <SkeletonLoader width={40} height={40} />
              <SkeletonLoader width={60} height={16} style={{ marginTop: 8 }} />
              <SkeletonLoader width={40} height={14} style={{ marginTop: 4 }} />
            </View>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.profileLogoutSection}>
        <SkeletonLoader width={80} height={20} />
      </View>
    </View>
  );
};

export const JobDetailsSkeleton: React.FC = () => {
  return (
    <View style={styles.jobDetailsContainer}>
      {/* Header Section */}
      <View style={styles.jobDetailsHeader}>
        <SkeletonLoader width="70%" height={24} borderRadius={4} />
        <View style={styles.jobDetailsStatusRow}>
          <SkeletonLoader width={80} height={28} borderRadius={14} />
          <SkeletonLoader width={100} height={36} borderRadius={8} style={{ marginLeft: 8 }} />
        </View>
      </View>

      {/* Job ID */}
      <SkeletonLoader width="30%" height={14} borderRadius={4} style={{ marginBottom: 16 }} />

      {/* Description */}
      <SkeletonLoader width="100%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
      <SkeletonLoader width="90%" height={14} borderRadius={4} style={{ marginBottom: 16 }} />

      {/* Communication Buttons */}
      <View style={styles.jobDetailsCommunicationButtons}>
        <SkeletonLoader width="48%" height={44} borderRadius={8} />
        <SkeletonLoader width="48%" height={44} borderRadius={8} />
      </View>

      {/* Verification Buttons */}
      <View style={styles.jobDetailsVerificationSection}>
        <SkeletonLoader width="40%" height={18} borderRadius={4} style={{ marginBottom: 12 }} />
        <View style={styles.jobDetailsVerificationButtons}>
          <SkeletonLoader width="48%" height={48} borderRadius={8} />
          <SkeletonLoader width="48%" height={48} borderRadius={8} />
        </View>
        <View style={styles.jobDetailsVerificationButtons}>
          <SkeletonLoader width="48%" height={48} borderRadius={8} />
          <SkeletonLoader width="48%" height={48} borderRadius={8} />
        </View>
      </View>

      {/* Route Section */}
      <View style={styles.jobDetailsRouteSection}>
        {/* Pickup */}
        <View style={styles.jobDetailsRoutePoint}>
          <SkeletonLoader width={32} height={32} borderRadius={16} />
          <View style={styles.jobDetailsRouteInfo}>
            <SkeletonLoader width="30%" height={14} borderRadius={4} />
            <SkeletonLoader width="100%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
            <SkeletonLoader width="80%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
            <SkeletonLoader width="60%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>

        {/* Connector */}
        <SkeletonLoader width={2} height={40} borderRadius={1} style={{ marginLeft: 16, marginVertical: 8 }} />

        {/* Delivery */}
        <View style={styles.jobDetailsRoutePoint}>
          <SkeletonLoader width={32} height={32} borderRadius={16} />
          <View style={styles.jobDetailsRouteInfo}>
            <SkeletonLoader width="30%" height={14} borderRadius={4} />
            <SkeletonLoader width="100%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
            <SkeletonLoader width="80%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
            <SkeletonLoader width="60%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>

      {/* Details Grid */}
      <View style={styles.jobDetailsGrid}>
        <View style={styles.jobDetailsGridRow}>
          <View style={styles.jobDetailsGridItem}>
            <SkeletonLoader width={20} height={20} borderRadius={10} />
            <View style={{ marginLeft: 8 }}>
              <SkeletonLoader width={60} height={12} borderRadius={4} />
              <SkeletonLoader width={80} height={14} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
          <SkeletonLoader width={20} height={20} borderRadius={10} />
          <View style={styles.jobDetailsGridItem}>
            <SkeletonLoader width={20} height={20} borderRadius={10} />
            <View style={{ marginLeft: 8 }}>
              <SkeletonLoader width={60} height={12} borderRadius={4} />
              <SkeletonLoader width={80} height={14} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
        </View>

        <View style={styles.jobDetailsGridRow}>
          <View style={styles.jobDetailsGridItem}>
            <SkeletonLoader width={20} height={20} borderRadius={10} />
            <View style={{ marginLeft: 8 }}>
              <SkeletonLoader width={60} height={12} borderRadius={4} />
              <SkeletonLoader width={80} height={14} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
          <View style={styles.jobDetailsGridItem}>
            <SkeletonLoader width={20} height={20} borderRadius={10} />
            <View style={{ marginLeft: 8 }}>
              <SkeletonLoader width={60} height={12} borderRadius={4} />
              <SkeletonLoader width={80} height={14} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
          </View>
        </View>
      </View>

      {/* Merchant Card */}
      <View style={styles.jobDetailsMerchantCard}>
        <SkeletonLoader width="30%" height={18} borderRadius={4} style={{ marginBottom: 12 }} />
        <View style={styles.jobDetailsMerchantContent}>
          <SkeletonLoader width={48} height={48} borderRadius={24} />
          <View style={styles.jobDetailsMerchantInfo}>
            <SkeletonLoader width="60%" height={16} borderRadius={4} />
            <SkeletonLoader width="40%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>
        <View style={styles.jobDetailsCommunicationButtons}>
          <SkeletonLoader width="48%" height={40} borderRadius={8} />
          <SkeletonLoader width="48%" height={40} borderRadius={8} />
        </View>
      </View>

      {/* Message Input */}
      <View style={styles.jobDetailsMessageSection}>
        <SkeletonLoader width="50%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="100%" height={80} borderRadius={8} />
      </View>

      {/* Bottom Action Button */}
      <SkeletonLoader width="100%" height={50} borderRadius={8} style={{ marginTop: 24 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.skeletonBase,
  },
  container: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageContainer: {
    marginTop: 4,
  },
  // Message skeleton styles
  messagesContainer: {
    padding: 16,
    flex: 1,
  },
  messageItem: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageItem: {
    justifyContent: 'flex-end',
  },
  otherMessageItem: {
    justifyContent: 'flex-start',
  },
  messageAvatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '80%',
    minWidth: 60,
  },
  userMessageBubble: {
    backgroundColor: Colors.skeletonUserMessage,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: Colors.skeletonOtherMessage,
    borderBottomLeftRadius: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  messageSpacer: {
    width: 40, // Space for avatar on other side
  },
  // Home screen skeleton styles
  homeContainer: {
    padding: 16,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileCardSkeleton: {
    borderRadius: 10,
    backgroundColor: Colors.skeletonBase,
    flexDirection: 'row',
    padding: 10,
    width: '48%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileTextContainer: {
    width: '60%',
  },
  locationCardSkeleton: {
    borderRadius: 10,
    backgroundColor: Colors.skeletonBase,
    flexDirection: 'row',
    padding: 10,
    width: '48%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationTextContainer: {
    width: '60%',
  },
  jobInvitationsSkeleton: {
    backgroundColor: Colors.skeletonBase,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  jobInvitationsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobInvitationsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jobInvitationsTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  actionButtonsSkeleton: {
    marginBottom: 16,
  },
  searchContainerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  statsContainerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCardSkeleton: {
    backgroundColor: Colors.skeletonBase,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  sectionSkeleton: {
    marginBottom: 24,
  },
  sectionHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  jobCardSkeleton: {
    backgroundColor: Colors.skeletonBase,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  quickActionSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skeletonBase,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  quickActionContentSkeleton: {
    flex: 1,
    marginLeft: 12,
  },
  // Jobs screen skeleton styles
  jobsContainer: {
    padding: 16,
  },
  jobsHeader: {
    marginBottom: 16,
  },
  jobsTabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  jobsJobCardSkeleton: {
    backgroundColor: Colors.skeletonBase,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  jobsJobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobLocationSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  jobDetailsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobFooterSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  // Profile screen skeleton styles
  profileContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 50,
  },
  profileHeaderSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  profileAvatarContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  profileAvatarSkeleton: {
    borderRadius: 50,
  },
  profileEditButtonSkeleton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 16,
  },
  profileContactSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  profileContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  profileTabSkeleton: {
    marginRight: 16,
    borderRadius: 8,
  },
  profileContentSection: {
    paddingHorizontal: 16,
  },
  profileSection: {
    marginBottom: 24,
  },
  profileDocumentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skeletonBase,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  profileDocumentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileLogoutSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  // Job Details skeleton styles
  jobDetailsContainer: {
    padding: 16,
  },
  jobDetailsHeader: {
    marginBottom: 16,
  },
  jobDetailsStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  jobDetailsCommunicationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  jobDetailsVerificationSection: {
    marginBottom: 16,
    backgroundColor: Colors.skeletonBase,
    padding: 16,
    borderRadius: 12,
  },
  jobDetailsVerificationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  jobDetailsRouteSection: {
    backgroundColor: Colors.skeletonBase,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  jobDetailsRoutePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  jobDetailsRouteInfo: {
    flex: 1,
    marginLeft: 12,
  },
  jobDetailsGrid: {
    backgroundColor: Colors.skeletonBase,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  jobDetailsGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  jobDetailsGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jobDetailsMerchantCard: {
    backgroundColor: Colors.skeletonBase,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  jobDetailsMerchantContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobDetailsMerchantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  jobDetailsMessageSection: {
    marginBottom: 16,
  },
  // Driver listing skeleton styles
  driverCard: {
    backgroundColor: Colors.skeletonBase,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverDetails: {
    flex: 1,
    marginLeft: 12,
  },
  driverRatingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  // Rating screen skeleton styles
  ratingContainer: {
    padding: 16,
  },
  ratingSummaryCard: {
    backgroundColor: Colors.skeletonBase,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  ratingAverageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingStarsSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingDistributionSection: {
    marginTop: 16,
  },
  ratingBarSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingReviewCard: {
    backgroundColor: Colors.skeletonBase,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  ratingReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ratingReviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ratingReviewerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  ratingReviewMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Notification skeleton styles
  notificationContainer: {
    padding: 16,
  },
  notificationItemSkeleton: {
    flexDirection: 'row',
    backgroundColor: Colors.skeletonBase,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationContentSkeleton: {
    flex: 1,
  },
});

// Driver Listing Skeleton
export const DriverListingSkeleton: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={`driver-skeleton-${item}`} style={styles.driverCard}>
          <View style={styles.driverInfoSection}>
            {/* Profile Icon */}
            <SkeletonLoader width={48} height={48} borderRadius={24} />
            
            <View style={styles.driverDetails}>
              {/* Driver Name */}
              <SkeletonLoader width="70%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
              
              {/* Rating Section */}
              <View style={styles.driverRatingSection}>
                <SkeletonLoader width={60} height={16} borderRadius={4} />
                <SkeletonLoader width={70} height={16} borderRadius={4} style={{ marginLeft: 12 }} />
              </View>
              
              {/* Vehicle Type */}
              <SkeletonLoader width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
              
              {/* Location */}
              <SkeletonLoader width="80%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          </View>
          
          {/* Action Button */}
          <SkeletonLoader width={80} height={36} borderRadius={8} />
        </View>
      ))}
    </View>
  );
};

// Rating Screen Skeleton
export const RatingScreenSkeleton: React.FC = () => {
  return (
    <View style={styles.ratingContainer}>
      {/* Summary Card Skeleton */}
      <View style={styles.ratingSummaryCard}>
        {/* Average Rating Section */}
        <View style={styles.ratingAverageSection}>
          <SkeletonLoader width={80} height={48} borderRadius={4} />
          <View style={styles.ratingStarsSkeleton}>
            {[1, 2, 3, 4, 5].map((star) => (
              <SkeletonLoader key={star} width={20} height={20} borderRadius={10} style={{ marginHorizontal: 2 }} />
            ))}
          </View>
          <SkeletonLoader width={150} height={16} borderRadius={4} style={{ marginTop: 8 }} />
        </View>

        {/* Distribution Section */}
        <View style={styles.ratingDistributionSection}>
          {[5, 4, 3, 2, 1].map((stars) => (
            <View key={stars} style={styles.ratingBarSkeleton}>
              <SkeletonLoader width={30} height={14} borderRadius={4} />
              <SkeletonLoader width="60%" height={8} borderRadius={4} style={{ marginHorizontal: 8 }} />
              <SkeletonLoader width={20} height={14} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Write Review Button Skeleton */}
      <SkeletonLoader width="100%" height={48} borderRadius={8} style={{ marginBottom: 24 }} />

      {/* Reviews Section Header */}
      <SkeletonLoader width={100} height={20} borderRadius={4} style={{ marginBottom: 16 }} />

      {/* Review Cards Skeleton */}
      {[1, 2, 3].map((item) => (
        <View key={`review-skeleton-${item}`} style={styles.ratingReviewCard}>
          <View style={styles.ratingReviewHeader}>
            <View style={styles.ratingReviewerInfo}>
              <SkeletonLoader width={40} height={40} borderRadius={20} />
              <View style={styles.ratingReviewerDetails}>
                <SkeletonLoader width={120} height={16} borderRadius={4} />
                <View style={styles.ratingReviewMetadata}>
                  <SkeletonLoader width={100} height={12} borderRadius={4} style={{ marginTop: 4 }} />
                </View>
              </View>
            </View>
            <View style={styles.ratingStarsSkeleton}>
              {[1, 2, 3, 4, 5].map((star) => (
                <SkeletonLoader key={star} width={12} height={12} borderRadius={6} style={{ marginHorizontal: 1 }} />
              ))}
            </View>
          </View>
          <SkeletonLoader width="90%" height={14} borderRadius={4} style={{ marginTop: 12 }} />
          <SkeletonLoader width="100%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
          <SkeletonLoader width="70%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
};

interface NotificationSkeletonProps {
  count?: number;
}

export const NotificationSkeleton: React.FC<NotificationSkeletonProps> = ({
  count = 5,
}) => {
  return (
    <View style={styles.notificationContainer}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.notificationItemSkeleton}>
          {/* Icon skeleton */}
          <SkeletonLoader width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
          
          {/* Content skeleton */}
          <View style={styles.notificationContentSkeleton}>
            {/* Title skeleton */}
            <SkeletonLoader width="70%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            
            {/* Message skeleton - 2 lines */}
            <SkeletonLoader width="90%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
            <SkeletonLoader width="60%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
            
            {/* Time skeleton */}
            <SkeletonLoader width="30%" height={12} borderRadius={4} />
          </View>
          
          {/* Unread indicator skeleton (optional, only for some items) */}
          {index % 3 === 0 && (
            <SkeletonLoader width={8} height={8} borderRadius={4} style={{ marginLeft: 8, alignSelf: 'flex-start', marginTop: 8 }} />
          )}
        </View>
      ))}
    </View>
  );
};

/**
 * CallHistory Screen
 * @format
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
} from 'lucide-react-native';

//Screens
import { Colors } from '@app/styles';
import { useAuthStore } from '@app/store/authStore';
import { useChatStore } from '@app/store/chatStore';
import { Call } from '@app/types';
import { useDispatch } from 'react-redux';
import { useThemedStyle } from '../../../styles';
import { getStyles } from './styles';
import Header from '../../../components/Header';
import { useTranslation } from 'react-i18next';

function CallHistoryScreen() {
  const { t } = useTranslation();

  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const { userProfile } = useAuthStore();
  const { fetchCalls } = useChatStore();

  const [calls, setCalls] = useState<Call[]>([]);
  const disptach = useDispatch();

  useEffect(() => {
    if (userProfile) {
      const userCalls = fetchCalls(userProfile.id);
      setCalls(userCalls);
    }
  }, [userProfile]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (call: Call) => {
    const isOutgoing = call.callerId === userProfile?.id;

    switch (call.status) {
      case 'missed':
        return <PhoneMissed size={20} color={Colors.error} />;
      case 'completed':
        return isOutgoing ? (
          <PhoneOutgoing size={20} color={Colors.success} />
        ) : (
          <PhoneIncoming size={20} color={Colors.success} />
        );
      case 'outgoing':
        return <PhoneOutgoing size={20} color={Colors.primary} />;
      case 'incoming':
        return <PhoneIncoming size={20} color={Colors.primary} />;
      default:
        return <Phone size={20} color={Colors.gray500} />;
    }
  };

  const renderCallItem = ({ item }: { item: Call }) => {
    const isOutgoing = item.callerId === userProfile?.id;
    const contactName = isOutgoing ? item.receiverName : item.callerName;

    return (
      <TouchableOpacity
        style={styles.callItem}
        onPress={() => navigation.navigate('call', { id: item.id })}
      >
        <View style={styles.callIconContainer}>{getCallIcon(item)}</View>

        <View style={styles.callInfo}>
          <View style={styles.callHeader}>
            <Text style={styles.contactName}>{contactName}</Text>
            <Text style={styles.callTimestamp}>
              {formatTimestamp(item.startTime)}
            </Text>
          </View>

          <View style={styles.callDetails}>
            <View style={styles.callTypeContainer}>
            <Text style={styles.callType}>
                {isOutgoing 
                  ? t('callHistory.outgoing') 
                  : t('callHistory.incoming')}
              </Text>
            </View>

            <View style={styles.callDurationContainer}>
              <Clock
                size={14}
                color={Colors.gray500}
                style={styles.durationIcon}
              />
              <Text style={styles.callDuration}>
                {formatDuration(item.duration)}
              </Text>
            </View>

            {item.recorded && (
              <View style={styles.recordingBadge}>
 <Text style={styles.recordingText}>
                  {t('callHistory.recorded')}
                </Text>   
                           </View>
            )}
          </View>

          {item.jobId && (
            <View style={styles.jobBadge}>
              <Text style={styles.jobBadgeText}>
              {t('callHistory.jobBadge', { id: item.jobId.substring(1, 6) })}  
                          </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Phone size={40} color={Colors.gray400} style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>No Call History</Text>
      {t('callHistory.emptyDescription')}

    </View>
  );

  return (
    <View style={styles.container}>
      <Header title={t('callHistory.title')} />
      <FlatList
        data={calls}
        keyExtractor={item => item.id}
        renderItem={renderCallItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

export { CallHistoryScreen };

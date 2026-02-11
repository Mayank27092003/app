/**
 * JobApply Screen
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  MapPin,
  Calendar,
  Truck,
  MessageSquare,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

//Screens
import { Colors, useThemedStyle } from '@app/styles';
import { useAuthStore } from '@app/store/authStore';
import { fetchJobById, applyjob } from '@app/module/jobs/slice';
import { selectCurrentJob, selectLoader } from '@app/module/common/selectors';
import { Button } from '@app/components/Button';
import { getStyles } from './jobapplyStyle';
import { Routes } from '@app/navigator';
import Header from '@app/components/Header';
import { formatCurrency } from '@app/utils';

type RootStackParamList = {
  CallScreen: { id: string };
};
type CallScreenRouteProp = RouteProp<RootStackParamList, 'CallScreen'>;

function JobApplyScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const route = useRoute<CallScreenRouteProp>();

  const { id } = route?.params || {};
  const { userProfile } = useAuthStore();
  const dispatch = useDispatch();
  const job = useSelector(selectCurrentJob);
  const isLoading = useSelector(selectLoader);

  console.log('JobApplyScreen - Route params:', route?.params);
  console.log('JobApplyScreen - Job ID:', id);
  console.log('JobApplyScreen - Job data:', job);
  console.log('JobApplyScreen - Is loading:', isLoading);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper function to safely extract string values from objects
  const getStringValue = (value: any, fallback: string = ''): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object' && value !== null) {
      // If it's an object, try to extract a meaningful string representation
      if (value.city) return value.city;
      if (value.name) return value.name;
      if (value.title) return value.title;
      if (value.address) return value.address;
      // If none of the above, return the fallback
      return fallback;
    }
    return fallback;
  };
  
  useEffect(() => {
    if (id) {
      console.log('Fetching job with ID:', id);
      dispatch(fetchJobById({ id }));
    } else {
      console.error('No job ID provided in route params');
      Alert.alert(t('common.error'), t('common.noJobIdProvided') || 'No job ID provided', [
        { text: t('common.ok'), onPress: () => navigation.goBack() }
      ]);
    }
  }, [id, dispatch, t, navigation]);

  const handleApply = async() => {
    console.log('handleApply - job:', job);
    console.log('handleApply - userProfile:', userProfile);
    console.log('handleApply - id:', id);
    
 

    setLoading(true);

    const applicationData = {
      jobId: parseInt(id),
      coverLetter: message || "I am interested in this job opportunity.",
      proposedRate: Number(job?.payAmount || job?.compensation || 0),
            estimatedDuration: "2 hours",
      notes: message || "Available immediately"
    };
    
    console.log('applicationData:', applicationData);
  const response = await dispatch(applyjob(applicationData));
  console.log('response: of job apple ', response);
  if (response?.payload) {
    navigation.navigate(Routes.PickJobsScreen);
  } 

   
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title={t('buttons.applyforJob')}/>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <Header title={t('buttons.applyforJob')}/>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Job not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={t('buttons.applyforJob')}/>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.jobCard}>
          <Text style={styles.jobTitle}>{getStringValue(job?.title || job?.jobTitle, 'Job Title')}</Text>

          <View style={styles.jobDetail}>
            <MapPin size={16} color={Colors.primary} style={styles.jobIcon} />
            <Text style={styles.jobText}>
              {getStringValue(job?.pickup?.city || job?.pickupLocation, 'Pickup Location')}
              {!!getStringValue(job?.pickup?.state) && `, ${getStringValue(job?.pickup?.state)}`}
              {` ${t('common.to')} `}
              {getStringValue(job?.delivery?.city || job?.deliveryLocation, 'Delivery Location')}
              {!!getStringValue(job?.delivery?.state) && `, ${getStringValue(job?.delivery?.state)}`}
            </Text>
          </View>

          <View style={styles.jobDetail}>
            <Calendar size={16} color={Colors.primary} style={styles.jobIcon} />
            <Text style={styles.jobText}>
              {/* {getStringValue(job?.pickup?.date || job?.pickupDate, 'Pickup Date')} - {getStringValue(job?.delivery?.date || job?.deliveryDate, 'Delivery Date')} */}
          {job.pickupLocation?.date} - {job.dropoffLocation?.date}
            </Text>
          </View>

          <View style={styles.jobDetail}>
            <Truck size={16} color={Colors.primary} style={styles.jobIcon} />
           
            <Text style={styles.jobText}>
              {getStringValue(job?.requiredTruckType || job?.truckType, 'Truck Type')}
            </Text>
          </View>

          <View style={styles.jobDetail}>
            {/* <DollarSign
              size={16}
              color={Colors.success}
              style={styles.jobIcon}
            /> */}
            {/* <Text style={[styles.jobText, styles.compensationText]}>
              {getStringValue(job?.compensation || job?.pay || job?.amount, '0')} {getStringValue(job?.currency, '$')}
            </Text> */}
                  <Text style={styles.compensationText}>
            {formatCurrency(
              parseFloat(job.payAmount || job.compensation?.toString() || '0'), 
              job.currency || 'USD'
            )}
          </Text>
          </View>
        </View>

        <View style={styles.messageSection}>
          <View style={styles.messageLabelContainer}>
            <MessageSquare
              size={16}
              color={Colors.text}
              style={styles.messageIcon}
            />
            <Text style={styles.messageLabel}>{t('jobs.messageToMerchant')}</Text>
          </View>

          <TextInput
            style={styles.messageInput}
          placeholder={t('jobs.messagePlaceholder')}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor={Colors.gray400}
          />
        </View>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            {t('jobs.termsAgreementjobApply')}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('buttons.submitApplication')}
          variant="primary"
          fullWidth
          loading={loading}
          onPress={handleApply}
        />
      </View>
    </View>
  );
}

export { JobApplyScreen };
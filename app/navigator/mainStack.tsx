/**
 * App Main Navigator
 * @format
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

//Screens
import { BottomTab } from './bottom-tab';
import { Routes } from './constants';

import {AddPaymentMethodScreen, DepositScreen, PaymentHistoryScreen, PaymentMethodsScreen, PaymentsScreen, TransactionDetailScreen, WithdrawScreen} from '@app/module/payments';
import {DocumentsScreen} from '../module/profile/view/documents';
import {EditProfileScreen} from '../module/profile/view/editProfile';
import LanguageSettingsScreen from '../module/settings/view/language';
import TermsScreen from '../module/settings/view/terms';
import {VerificationCameraScreen} from '../module/verification/view/camera';
import {TrackingScreen} from '../module/tracking/view/tracking';
import {TripTrackingScreen} from '../module/tracking/view/tripTracking';
import {MessagesScreen} from '../module/messages/view/messages';
import {ProfileScreen} from '../module/profile/view/profile';
import { CallScreen, CallHistoryScreen } from '../module/calls';
import { ChatScreen } from '../module/chat';
import { CreateJobScreen, JobApplyScreen,JobDetailScreen, PickJobsScreen } from '../module/jobs';
import { JobInvitationsScreen } from '../module/jobs/view/jobInvitations';
import { JobBidsScreen } from '../module/jobs/view/jobBids';
import { DriverListingScreen, DriverAssignmentScreen, DriverDetailScreen } from '../module/drivers';
import { SocketDebugScreen } from '../module/debug';
// import { JobDetailScreen } from '../module/jobs';
// Screens

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BottomTab" component={BottomTab} />
      <Stack.Screen name={Routes.CallScreen} component={CallScreen} />
      {/* <Stack.Screen name={Routes.WelcomeScreen} component={CallScreen} /> */}

      <Stack.Screen
        name={Routes.CallHistoryScreen}
        component={CallHistoryScreen}
      />
      <Stack.Screen name={Routes.ChatScreen} component={ChatScreen} />
      <Stack.Screen name={Routes.CreateJobScreen} component={CreateJobScreen} />
      <Stack.Screen name={Routes.JobApplyScreen} component={JobApplyScreen} />
      <Stack.Screen
        name={Routes.AddPaymentMethodScreen}
        component={AddPaymentMethodScreen}
      />
      <Stack.Screen
        name={Routes.TransactionDetailScreen}
        component={TransactionDetailScreen}
      />
      <Stack.Screen name={Routes.DepositScreen} component={DepositScreen} />
      <Stack.Screen
        name={Routes.PaymentHistoryScreen}
        component={PaymentHistoryScreen}
      />
      <Stack.Screen
        name={Routes.PaymentMethodsScreen}
        component={PaymentMethodsScreen}
      />
      <Stack.Screen name={Routes.WithdrawScreen} component={WithdrawScreen} />
      <Stack.Screen name={Routes.DocumentsScreen} component={DocumentsScreen} />
      <Stack.Screen
        name={Routes.EditProfileScreen}
        component={EditProfileScreen}
      />
      <Stack.Screen
        name={Routes.LanguageSettingsScreen}
        component={LanguageSettingsScreen}
      />
      <Stack.Screen name={Routes.TermsScreen} component={TermsScreen} />
      <Stack.Screen
        name={Routes.VerificationCameraScreen}
        component={VerificationCameraScreen}
      />
      <Stack.Screen name={Routes.TrackingScreen} component={TrackingScreen} />
      <Stack.Screen name={Routes.TripTrackingScreen} component={TripTrackingScreen} />
      <Stack.Screen name={Routes.MessagesScreen} component={MessagesScreen} />
      <Stack.Screen name={Routes.ProfileScreen} component={ProfileScreen} />
      <Stack.Screen name={Routes.PaymentScreen} component={PaymentsScreen} />
      <Stack.Screen name={Routes.PickJobsScreen} component={PickJobsScreen} />

      <Stack.Screen name={Routes.JobDetailsScreen} component={JobDetailScreen} />
      <Stack.Screen name={Routes.JobBidsScreen} component={JobBidsScreen} />
      <Stack.Screen name={Routes.JobInvitationsScreen} component={JobInvitationsScreen} />
      <Stack.Screen name={Routes.DriverListingScreen} component={DriverListingScreen} />
      <Stack.Screen name={Routes.DriverAssignmentScreen} component={DriverAssignmentScreen} />
      <Stack.Screen name={Routes.DriverDetailScreen} component={DriverDetailScreen} />
      <Stack.Screen name={Routes.SocketDebugScreen} component={SocketDebugScreen} />

      {/* <Stack.Screen name={Routes.Contact} component={Contact} /> */}

    </Stack.Navigator>
  );
};

export { MainStack };

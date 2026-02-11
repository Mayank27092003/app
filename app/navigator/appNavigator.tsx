import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomDrawer from "./customDrawer";
import { Routes } from "./constants";
import {AddPaymentMethodScreen, DepositScreen, PaymentHistoryScreen, PaymentMethodsScreen, PaymentsScreen, TransactionDetailScreen, WithdrawScreen} from '@app/module/payments';
import {DocumentsScreen} from '../module/profile/view/documents';
import {EditProfileScreen} from '../module/profile/view/editProfile';
import LanguageSettingsScreen from '../module/settings/view/language';
import TermsScreen from '../module/settings/view/terms';
import {VerificationCameraScreen} from '../module/verification/view/camera';
import {TrackingScreen} from '../module/tracking/view/tracking';
import {MessagesScreen} from '../module/messages/view/messages';
import {ProfileScreen} from '../module/profile/view/profile';
import { CallScreen, CallHistoryScreen } from '../module/calls';
import WebRTCTestScreen from '../module/calls/view/WebRTCTestScreen';
import IncomingCallScreen from '../module/calls/view/IncomingCallScreen';
import { ChatScreen } from '../module/chat';
import GroupDetailsScreen from '../module/chat/view/groupDetails';
import { CreateJobScreen, JobApplyScreen,JobDetailScreen, PickJobsScreen } from '../module/jobs';
import { ReshareJobScreen } from '../module/jobs/view/reshareJob';
import { DriverAssignmentScreen, DriverListingScreen, DriverDetailScreen } from "@app/module/drivers";
import { SocketDebugScreen } from "@app/module/debug";
import { JobInvitationsScreen } from "@app/module/jobs/view/jobInvitations";
import { JobBidsScreen } from "@app/module/jobs/view/jobBids";
import { TripTrackingScreen } from "@app/module/tracking/view/tripTracking";
import CarrierListingScreen from "@app/module/drivers/view/carrierListing";
import PrivacyPolicyScreen from "@app/module/settings/view/PrivacyPolicyScreen";
import ContactUsScreen from "@app/module/settings/view/ContactUsScreen";
import RatingScreen from "@app/module/profile/view/RatingScreen";

const Stack = createNativeStackNavigator()
const AppNavigator = () => {
  return (
<Stack.Navigator 
  id={undefined}
  initialRouteName="CustomDrawer" 
  screenOptions={{headerShown:false}}
>   
     <Stack.Screen name="CustomDrawer" component={CustomDrawer}/>
    {/* <Stack.Screen name="BottomTab" component={BottomTab} /> */}
      <Stack.Screen name={Routes.CallScreen} component={CallScreen} />
      <Stack.Screen name="WebRTCTestScreen" component={WebRTCTestScreen} />
      <Stack.Screen name="IncomingCallScreen" component={IncomingCallScreen} />
      {/* <Stack.Screen name={Routes.WelcomeScreen} component={CallScreen} /> */}

      <Stack.Screen
        name={Routes.CallHistoryScreen}
        component={CallHistoryScreen}
      />
      <Stack.Screen name={Routes.ChatScreen} component={ChatScreen} />
      <Stack.Screen name={Routes.GroupDetailsScreen} component={GroupDetailsScreen} />
      <Stack.Screen name={Routes.CreateJobScreen} component={CreateJobScreen} />
      <Stack.Screen name={Routes.ReshareJobScreen} component={ReshareJobScreen} />
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
      <Stack.Screen name={Routes.PrivacyPolicyScreen} component={PrivacyPolicyScreen} />
      <Stack.Screen name={Routes.ContactUsScreen} component={ContactUsScreen} />
      <Stack.Screen
        name={Routes.VerificationCameraScreen}
      component={VerificationCameraScreen}
      />
      <Stack.Screen name={Routes.TrackingScreen} component={TrackingScreen} />
      <Stack.Screen name={Routes.MessagesScreen} component={MessagesScreen} />
      <Stack.Screen name={Routes.ProfileScreen} component={ProfileScreen} />
      <Stack.Screen name={Routes.PaymentScreen} component={PaymentsScreen} />
      <Stack.Screen name={Routes.PickJobsScreen} component={PickJobsScreen} />

      <Stack.Screen name={Routes.JobDetailsScreen} component={JobDetailScreen} />
      <Stack.Screen name={Routes.DriverListingScreen} component={DriverListingScreen} />
      <Stack.Screen name={Routes.DriverAssignmentScreen} component={DriverAssignmentScreen} />
      <Stack.Screen name={Routes.DriverDetailScreen} component={DriverDetailScreen} />
      <Stack.Screen name={Routes.SocketDebugScreen} component={SocketDebugScreen} />
      <Stack.Screen name={Routes.JobInvitationsScreen} component={JobInvitationsScreen} />
      <Stack.Screen name={Routes.JobBidsScreen} component={JobBidsScreen} />
      <Stack.Screen name={Routes.TripTrackingScreen} component={TripTrackingScreen} />
      <Stack.Screen name={Routes.CarrierListingScreen} component={CarrierListingScreen} />
      <Stack.Screen name={Routes.RatingScreen} component={RatingScreen} />

      {/* <Stack.Screen name={Routes.Contact} component={Contact} /> */}


   </Stack.Navigator>
  );
};

export default AppNavigator;

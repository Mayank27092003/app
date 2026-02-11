/**
 * App constants
 * @format
 */



/**
 * App routes constants for define
 * screen key in navigator and use
 * them for navigate to that screen
 */
const Routes = {
  HomeScreen: 'HomeScreen',
  LoginScreen: 'LoginScreen',
  OTPScreen: 'OTPScreen',
  ResetPasswordScreen: 'ResetPasswordScreen',
  ForgetPassword:'ForgetPassword',
  RegisterScreen: 'RegisterScreen',
  RoleSelectScreen: 'RoleSelectScreen',
  CallScreen: 'CallScreen',
  CallHistoryScreen:'CallHistoryScreen',
  ChatScreen: 'ChatScreen',
  JobsScreen: 'JobsScreen',
  PickJobsScreen: 'PickJobsScreen',
  CreateJobScreen : 'CreateJobScreen',
  JobApplyScreen: 'JobApplyScreen',
  MessagesScreen: 'MessagesScreen',
  ProfileScreen: 'ProfileScreen',
  ProfileEditScreen: 'ProfileEditScreen',
  NotificationScreen: 'NotificationScreen',
  AddPaymentMethodScreen: 'AddPaymentMethodScreen',
  TransactionDetailScreen: 'TransactionDetailScreen',
  DepositScreen: 'DepositScreen',
  PaymentScreen: 'PaymentScreen',
  PaymentHistoryScreen: 'PaymentHistoryScreen',
  PaymentMethodsScreen: 'PaymentMethodsScreen',
  WithdrawScreen: 'WithdrawScreen',
  DocumentsScreen: 'DocumentsScreen',
  EditProfileScreen: 'EditProfileScreen',
  LanguageSettingsScreen: 'LanguageSettingsScreen',
  TermsScreen: 'TermsScreen',
  VerificationCameraScreen: 'VerificationCameraScreen',
  TrackingScreen: 'TrackingScreen',
  TripTrackingScreen: 'TripTrackingScreen',
  JobDetailsScreen: 'JobDetailsScreen',
  JobBidsScreen: 'JobBidsScreen',
  DriverListingScreen: 'DriverListingScreen',
  DriverAssignmentScreen: 'DriverAssignmentScreen',
  SocketDebugScreen: 'SocketDebugScreen',
  JobInvitationsScreen: 'JobInvitationsScreen',
  ContactUsScreen: 'ContactUsScreen',
  WelcomeScreen:'WelcomeScreen',
  PrivacyPolicyScreen:'PrivacyPolicyScreen',
  AppIntro: 'AppIntro',
  CarrierListingScreen: 'CarrierListingScreen',
  GroupDetailsScreen: 'GroupDetailsScreen',
  ReshareJobScreen: 'ReshareJobScreen',
  RatingScreen: 'RatingScreen',
  DriverDetailScreen: 'DriverDetailScreen',

};

/**
 * App section constants for
 * switch between app section
 * like: (Auth, Main)
 */
const AppSection = {
  AuthSection: 'AuthSection',
  MainSection: 'MainSection',
};

// Make object not changeable
Object.freeze(Routes);
Object.freeze(AppSection);

export { Routes, AppSection };

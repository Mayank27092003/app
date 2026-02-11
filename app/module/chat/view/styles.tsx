/**
 * Chat Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet, Typography } from '@app/styles';
import { Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    messagesContainer: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: '16@ms',
      paddingTop: '10@ms',
      paddingBottom: '16@ms',
      backgroundColor: Colors.background,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,

    },
    backButton: {
      width: '40@ms',
      height: '40@ms',
      justifyContent: 'center',
      alignItems: 'center',
      
    },
    headerProfile: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      // marginLeft: '8@ms',
    },
    headerAvatar: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '20@ms',
      backgroundColor: Colors.primary,
marginRight: '8@ms',
    },
    headerAvatarFallback: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '20@ms',
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerAvatarText: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.white,
    },
    headerInfo: {
      width: '75%',
      // width: 200,
      // marginLeft: '-20@ms',
    },
    headerName: {
      fontSize: '14@ms',
      fontWeight: '600',
      color: Colors.white,

    },
    headerStatus: {
      fontSize: '12@ms',
      color: Colors.textSecondary,
    },
    headerActions: {
      flexDirection: 'row',
    },
    headerButton: {
      width: '36@ms',
      height: '36@ms',
      borderRadius: '18@ms',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: '8@ms',
    },
    messagesList: {
      // padding: '16@ms',
      paddingTop: '16@ms',
      paddingHorizontal: '16@ms',
      paddingBottom: '16@ms',
    },
    dateContainer: {
      alignItems: 'center',
      marginVertical: '20@ms',
      marginHorizontal: '16@ms',
    },
    dateText: {
      fontSize: '13@ms',
      color: Colors.textSecondary,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: '16@ms',
      paddingVertical: '8@ms',
      borderRadius: '16@ms',
      fontWeight: '500',
      textAlign: 'center',
      minWidth: '80@ms',
    },
    messageContainer: {
      flexDirection: 'row',
      marginBottom: '4@ms',
      maxWidth: '80%',
    },
    userMessageContainer: {
      alignSelf: 'flex-end',
      marginLeft: 'auto',
    },
    otherMessageContainer: {
      alignSelf: 'flex-start',
      marginRight: 'auto',
    },
    avatarContainer: {
      width: '32@ms',
      height: '32@ms',
      marginRight: '8@ms',
      alignSelf: 'flex-end',
      marginBottom: '4@ms',
    },
    avatar: {
      width: '32@ms',
      height: '32@ms',
      borderRadius: '16@ms',
    },
    avatarFallback: {
      width: '32@ms',
      height: '32@ms',
      borderRadius: '16@ms',
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: '14@ms',
      fontWeight: '600',
      color: Colors.white,
    },
    spacer: {
      width: '40@ms',
    },
    messageContent: {
      maxWidth: '100%',
    },
    userMessageContent: {
      alignItems: 'flex-end',
    },
    otherMessageContent: {
      alignItems: 'flex-start',
      width: '100%',
    },
    messageBubble: {
      padding: '12@ms',
      borderRadius: '18@ms',
      marginBottom: '2@ms',
      maxWidth: SCREEN_WIDTH * 0.7,
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    userMessageBubble: {
      backgroundColor: Colors.primary,
      borderBottomRightRadius: '6@ms',
    },
    otherMessageBubble: {
      backgroundColor: Colors.backgroundCard,
      borderBottomLeftRadius: '6@ms',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    singleMessageBubble: {
      borderRadius: '16@ms',
    },
    firstMessageBubble: {
      borderBottomLeftRadius: '16@ms',
      borderBottomRightRadius: '16@ms',
    },
    middleMessageBubble: {
      borderRadius: '16@ms',
    },
    lastMessageBubble: {
      borderTopLeftRadius: '16@ms',
      borderTopRightRadius: '16@ms',
    },
    messageText: {
      fontSize: '16@ms',
      color: Colors.white,
      lineHeight: '22@ms',
      paddingHorizontal: '5@ms',
    },
    messageTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      marginTop: '4@ms',
    },
    messageTime: {
      fontSize: '10@ms',
      color: Colors.white,
      marginRight: '4@ms',
    },
    messageStatus: {
      marginLeft: '2@ms',
    },
    imageMessageBubble: {
      padding: '2@ms',
      overflow: 'hidden',
    },
    messageImage: {
      width: SCREEN_WIDTH * 0.6,
      height: SCREEN_WIDTH * 0.6 * 0.75,
      borderRadius: '12@ms',
    },
    voiceMessageBubble: {
      paddingVertical: '12@ms',
      paddingHorizontal: '16@ms',
    },
    voiceMessageContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    voiceWaveform: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: '8@ms',
      height: '20@ms',
    },
    voiceWaveformBar: {
      width: '3@ms',
      marginHorizontal: '1@ms',
      borderRadius: '1.5@ms',
    },
    voiceDuration: {
      fontSize: '12@ms',
      marginLeft: '4@ms',
    },
    documentMessageBubble: {
      padding: '12@ms',
    },
    documentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    documentIconContainer: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '20@ms',
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '12@ms',
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      fontSize: '14@ms',
      fontWeight: '500',
      marginBottom: '2@ms',
    },
    documentSize: {
      fontSize: '12@ms',
      color: Colors.textSecondary,
    },
    locationMessageBubble: {
      padding: '12@ms',
      width: SCREEN_WIDTH * 0.65,
    },
    locationContainer: {
      width: '100%',
    },
    locationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: '8@ms',
    },
    locationText: {
      fontSize: '14@ms',
      fontWeight: '500',
      marginLeft: '6@ms',
    },
    locationMap: {
      width: '100%',
      height: '120@ms',
      borderRadius: '8@ms',
      backgroundColor: Colors.backgroundLight,
    },
    systemMessageContainer: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: '12@ms',
      padding: '8@ms',
      marginVertical: '8@ms',
      alignSelf: 'center',

    },
    systemMessageText: {
      fontSize: '12@ms',
      color: Colors.textSecondary,
      textAlign: 'center',
    },
    typingContainer: {
      flexDirection: 'row',
      marginTop: '8@ms',
      marginLeft: '40@ms',
    },
    typingBubble: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: '16@ms',
      padding: '12@ms',
      borderBottomLeftRadius: '4@ms',
      flexDirection: 'row',
      alignItems: 'center',
    },
    typingDots: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    typingDot: {
      width: '6@ms',
      height: '6@ms',
      borderRadius: '3@ms',
      backgroundColor: Colors.primary,
      marginHorizontal: '2@ms',
    },
    typingDot1: {
      opacity: 0.4,
      transform: [{ translateY: -2 }],
    },
    typingDot2: {
      opacity: 0.7,
      transform: [{ translateY: 2 }],
    },
    typingDot3: {
      opacity: 1,
      transform: [{ translateY: -1 }],
    },
    typingText: {
      fontSize: '14@ms',
      color: Colors.textSecondary,
      marginRight: '8@ms',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: '16@ms',
      paddingVertical: '12@ms',
      paddingBottom: '20@ms', // Extra bottom padding to prevent cropping
      backgroundColor: Colors.background,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      minHeight: '60@ms',
    },
    attachButton: {
      width: '40@ms',
      height: '40@ms',
      justifyContent: 'center',
      alignItems: 'center',
    },
    textInputContainer: {
      flex: 1,
      backgroundColor: Colors.backgroundCard,
      borderRadius: '24@ms',
      paddingHorizontal: '16@ms',
      marginHorizontal: '8@ms',
      minHeight: '40@ms',
      maxHeight: '100@ms',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    input: {
      color: Colors.white,
      fontSize: '16@ms',
      maxHeight: 100,
      paddingVertical: '10@ms',
      textAlignVertical: 'center',
    },
    sendButton: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '20@ms',
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    recordingButton: {
      backgroundColor: Colors.error,
    },
    attachmentContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: '16@ms',
      backgroundColor: Colors.backgroundLight,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    attachmentOption: {
      alignItems: 'center',
    },
    attachmentIconContainer: {
      width: '50@ms',
      height: '50@ms',
      borderRadius: '25@ms',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '8@ms',
    },
    attachmentText: {
      fontSize: '12@ms',
      color: Colors.white,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: '40@ms',
    },
    emptyStateContent: {
      alignItems: 'center',
    },
    emptyStateTitle: {
      fontSize: '20@ms',
      fontWeight: '600',
      color: Colors.white,
      marginBottom: '8@ms',
      textAlign: 'center',
    },
    emptyStateText: {
      fontSize: '14@ms',
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: '20@ms',
    },
    // Group Details Screen Styles
    groupDetailsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: '16@ms',
      paddingTop: '10@ms',
      paddingBottom: '16@ms',
      backgroundColor: Colors.background,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    backButtonText: {
      fontSize: '20@ms',
      color: Colors.white,
      fontWeight: '600',
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.white,
    },
    headerSubtitle: {
      fontSize: '14@ms',
      color: Colors.textSecondary,
      marginTop: '2@ms',
    },
    groupInfoSection: {
      backgroundColor: Colors.backgroundLight,
      marginBottom: '16@ms',
      paddingHorizontal: '16@ms',
      paddingVertical: '16@ms',
      borderRadius: '8@ms',
      marginHorizontal: '16@ms',
    },
    groupInfoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: '12@ms',
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    groupInfoLabel: {
      fontSize: '14@ms',
      color: Colors.textSecondary,
      fontWeight: '500',
    },
    groupInfoValue: {
      fontSize: '14@ms',
      color: Colors.white,
      fontWeight: '400',
      maxWidth: '60%',
    },
    participantsSection: {
      flex: 1,
      backgroundColor: Colors.background,
      paddingTop: '8@ms',
    },
    sectionTitle: {
      fontSize: '16@ms',
      fontWeight: '600',
      color: Colors.white,
      paddingHorizontal: '16@ms',
      paddingVertical: '12@ms',
      backgroundColor: Colors.background,
    },
    participantsContainer: {
      flex: 1,
      paddingHorizontal: '16@ms',
    },
    participantsList: {
      flex: 1,
    },
    participantsContent: {
      paddingBottom: '20@ms',
      paddingHorizontal: '16@ms',
    },
    participantItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: '16@ms',
      paddingVertical: '16@ms',
      backgroundColor: Colors.backgroundCard,
      marginVertical: '4@ms',
      borderRadius: '8@ms',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    participantItemDisabled: {
      opacity: 0.6,
    },
    participantAvatar: {
      position: 'relative',
      marginRight: '12@ms',
    },
    participantAvatarImage: {
      width: '50@ms',
      height: '50@ms',
      borderRadius: '25@ms',
      // backgroundColor: Colors.primary,
      marginRight: '12@ms',

    },
    participantAvatarPlaceholder: {
      width: '50@ms',
      height: '50@ms',
      borderRadius: '25@ms',
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    participantAvatarText: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.white,
    },
    participantInfo: {
      flex: 1,
    },
    participantName: {
      fontSize: '16@ms',
      fontWeight: '600',
      color: Colors.text,
      marginBottom: '4@ms',
    },
    participantPhone: {
      fontSize: '14@ms',
      color: Colors.textSecondary,
    },
    participantRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    adminText: {
      fontSize: '14@ms',
      fontWeight: '500',
      color: Colors.primary,
      marginRight: '8@ms',
    },
    participantActionText: {
      fontSize: '20@ms',
      color: Colors.textSecondary,
      fontWeight: '300',
    },
    debugText: {
      fontSize: '12@ms',
      color: Colors.textSecondary,
      marginTop: '2@ms',
    },
    loadingMoreContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 16,
      gap: 8,
    },
    loadingMoreText: {
      fontSize: 14,
      color: Colors.textSecondary,
    },
    // Image Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageModalContainer: {
      backgroundColor: Colors.white,
      borderRadius: 12,
      width: '90%',
      maxHeight: '80%',
      padding: 20,
    },
    imageModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    imageModalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors.white,
    },
    imageModalCloseButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: Colors.backgroundCard,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageModalCloseText: {
      fontSize: 16,
      color: Colors.textSecondary,
    },
    imagePreviewContainer: {
      marginBottom: 16,
      borderRadius: 8,
      // overflow: 'hidden',
    },
    imagePreview: {
      width: '100%',
      height: 200,
    },
    imageTextInputContainer: {
      marginBottom: 20,
    },
    imageTextInput: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: Colors.black,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    imageModalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    imageModalCancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: Colors.backgroundCard,
      alignItems: 'center',
    },
    imageModalCancelText: {
      fontSize: 16,
      color: Colors.textSecondary,
      fontWeight: '500',
    },
    imageModalSendButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: Colors.primary,
      alignItems: 'center',
    },
    imageModalSendText: {
      fontSize: 16,
      color: Colors.white,
      fontWeight: '600',
    },
    imageModalSendButtonDisabled: {
      backgroundColor: Colors.textSecondary,
      opacity: 0.6,
    },
    imageModalLoadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    // Image Picker Modal Styles
    imagePickerModalContainer: {
      backgroundColor: Colors.white,
      borderRadius: 12,
      width: '90%',
      maxHeight: '60%',
      padding: 20,
    },
    imagePickerModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    imagePickerModalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors.white,
    },
    imagePickerModalCloseButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: Colors.backgroundCard,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imagePickerModalCloseText: {
      fontSize: 16,
      color: Colors.textSecondary,
    },
    imagePickerOptions: {
      marginBottom: 24,
    },
    imagePickerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 12,
      backgroundColor: Colors.backgroundCard,
    },
    imagePickerIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    imagePickerOptionText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.white,
      marginBottom: 2,
    },
    imagePickerOptionSubtext: {
      fontSize: 14,
      color: Colors.textSecondary,
    },
    imagePickerCancelButton: {
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: Colors.backgroundCard,
      alignItems: 'center',
    },
    imagePickerCancelText: {
      fontSize: 16,
      color: Colors.textSecondary,
      fontWeight: '500',
    },
    // Full Screen Image Modal Styles
    fullImageModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    
    fullImageModalContainer: {
      flex: 1,
      width: '100%',
    },
    
    fullImageHeader: {

      marginTop: '40@ms',
      justifyContent: 'space-between',
      flexDirection: 'row',
    },
    
    fullImageCloseButton: {
      width: '100@ms',
      height: '60@ms',
      // borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    fullImageContent: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    webview: {
      height: Dimensions.get('window').height, // make WebView fill available space
      width: Dimensions.get('window').width,
    },
    fullImage: {
      width: '100%',
      height: '100%',
      maxWidth: Dimensions.get('window').width,
      maxHeight: Dimensions.get('window').height,
    },
    imageContainer: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    scrollToBottomButton: {
      position: 'absolute',
      bottom: 100,
      right: 20,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    headerNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    onlineIndicator: {
      width: '12@ms',
      height: '12@ms',
      borderRadius: '6@ms',
      backgroundColor: '#4CAF50', // Green color for online
      position: 'absolute',
      right: '10@ms',
      bottom: 0, 
    },
    compactDocumentBubble: {
      padding: '8@ms',
      maxWidth: SCREEN_WIDTH * 0.7,
      alignSelf: 'flex-end',
    },
    compactDocumentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: '12@ms',
      backgroundColor: Colors.primary,
      borderRadius: '20@ms',
      minHeight: '40@ms',
    },
    compactDocumentIcon: {
      marginRight: '8@ms',
      justifyContent: 'center',
      alignItems: 'center',
    },
    compactDocumentName: {
      fontSize: '14@ms',
      fontWeight: '500',
      flex: 1,
      color: Colors.white,
    },
    
    // Bottom Sheet Styles
    bottomSheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    bottomSheetBackdrop: {
      flex: 1,
    },
    bottomSheetContainer: {
      backgroundColor: Colors.backgroundCard,
      borderTopLeftRadius: '20@ms',
      borderTopRightRadius: '20@ms',
      paddingBottom: '34@ms', // Safe area for devices with home indicator
      maxHeight: '50%',
    },
    bottomSheetHandle: {
      width: '40@ms',
      height: '4@ms',
      backgroundColor: Colors.border,
      borderRadius: '2@ms',
      alignSelf: 'center',
      marginTop: '12@ms',
      marginBottom: '8@ms',
    },
    bottomSheetHeader: {
      paddingHorizontal: '20@ms',
      paddingVertical: '16@ms',
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    bottomSheetTitle: {
      fontSize: '18@ms',
      fontWeight: '600',
      color: Colors.text,
      textAlign: 'center',
    },
    bottomSheetContent: {
      paddingVertical: '8@ms',
    },
    bottomSheetOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: '20@ms',
      paddingVertical: '16@ms',
      backgroundColor: Colors.backgroundCard,
    },
    bottomSheetOptionIcon: {
      width: '40@ms',
      height: '40@ms',
      borderRadius: '20@ms',
      backgroundColor: Colors.backgroundCard,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: '16@ms',
    },
    bottomSheetOptionTextContainer: {
      flex: 1,
    },
    bottomSheetOptionTitle: {
      fontSize: '16@ms',
      fontWeight: '500',
      color: Colors.text,
      marginBottom: '2@ms',
    },
    bottomSheetOptionSubtitle: {
      fontSize: '14@ms',
      color: Colors.textSecondary,
    },
    bottomSheetOptionArrow: {
      width: '24@ms',
      height: '24@ms',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bottomSheetArrowText: {
      fontSize: '18@ms',
      color: Colors.textSecondary,
      fontWeight: '300',
    },
    bottomSheetCancelButton: {
      marginHorizontal: '20@ms',
      marginTop: '8@ms',
      paddingVertical: '16@ms',
      backgroundColor: Colors.primary,
      borderRadius: '12@ms',
      alignItems: 'center',
    },
    bottomSheetCancelText: {
      fontSize: '16@ms',
      fontWeight: '500',
      color: Colors.text,
    },
    
    // System Message Styles
    systemMessageContainer: {
      alignItems: 'center',
      marginVertical: '8@ms',
      paddingHorizontal: '20@ms',
    },
    systemMessageText: {
      fontSize: '14@ms',
      color: Colors.textSecondary,
      textAlign: 'center',
      backgroundColor: Colors.backgroundCard,
      paddingHorizontal: '12@ms',
      paddingVertical: '6@ms',
      borderRadius: '12@ms',
      maxWidth: '80%',
    },
    // Multiple images styles
    multipleImagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '8@ms',
      maxHeight: '200@ms',
    },
    imageItemContainer: {
      position: 'relative',
      width: '80@ms',
      height: '80@ms',
    },
    multipleImagePreview: {
      width: '80@ms',
      height: '80@ms',
      borderRadius: '8@ms',
    },
    removeImageButton: {
      position: 'absolute',
      top: '-4@ms',
      right: '-4@ms',
      width: '20@ms',
      height: '20@ms',
      borderRadius: '10@ms',
      backgroundColor: Colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    removeImageText: {
      color: Colors.white,
      fontSize: '12@ms',
      fontWeight: 'bold',
    },
    addMoreImageButton: {
      width: '80@ms',
      height: '80@ms',
      borderRadius: '8@ms',
      backgroundColor: Colors.backgroundLight,
      borderWidth: '2@ms',
      borderColor: Colors.primary,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
    },
    addMoreImageText: {
      fontSize: '24@ms',
      color: Colors.primary,
      fontWeight: 'bold',
    },
    // Recording Indicator Styles
    recordingIndicator: {
      backgroundColor: Colors.error,
      paddingHorizontal: '16@ms',
      paddingVertical: '12@ms',
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    recordingContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recordingPulse: {
      width: '12@ms',
      height: '12@ms',
      borderRadius: '6@ms',
      backgroundColor: Colors.white,
      marginRight: '8@ms',
    },
    recordingText: {
      fontSize: '16@ms',
      color: Colors.white,
      fontWeight: '500',
      marginRight: '8@ms',
    },
    recordingDuration: {
      fontSize: '16@ms',
      color: Colors.white,
      fontWeight: '600',
      fontFamily: 'monospace',
    },
    pauseButton: {
      width: '32@ms',
      height: '32@ms',
      borderRadius: '16@ms',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: '12@ms',
    },
  });

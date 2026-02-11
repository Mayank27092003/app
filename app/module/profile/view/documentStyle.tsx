import { Colors, ITheme, ScaledSheet } from '@app/styles';

export const getStyles = () =>
    ScaledSheet.create({
        container: {
            flex: 1,
            backgroundColor: Colors.background,
          },
          scrollView: {
            flex: 1,
          },
          scrollContent: {
            padding: 20,
            paddingBottom: '100@ms',
          },
          title: {
            fontSize: '18@ms',
            fontWeight: '600',
            color: Colors.text,
          },
          subtitle: {
            fontSize: 16,
            color: Colors.gray600,
            marginBottom: 24,
            lineHeight: 22,
          },
          headerBack: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: '20@ms',
            paddingTop: '40@ms',
            paddingBottom: '20@ms',
            backgroundColor: Colors.backgroundLight,
          },
          backButton: {
            width: '40@ms',
            height: '40@ms',
            borderRadius: '20@ms',
            justifyContent: 'center',
            alignItems: 'center',
          },
          documentsContainer: {
            // backgroundColor: Colors.backgroundCard,
            

          },
          documentItem: {
            marginBottom: '16@ms',
            position: 'relative',
          },
          pendingOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '8@ms',
            zIndex: 1,
          },
          pendingText: {
            color: Colors.white,
            fontSize: '14@ms',
            fontWeight: '600',
            backgroundColor: Colors.warning,
            paddingHorizontal: '12@ms',
            paddingVertical: '6@ms',
            borderRadius: '16@ms',
          },
          statusOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '8@ms',
            zIndex: 1,
          },
          verifiedOverlay: {
            backgroundColor: 'rgba(76, 175, 80, 0.3)', // Green with transparency
          },
          rejectedOverlay: {
            backgroundColor: 'rgba(255, 77, 77, 0.3)', // Red with transparency
          },
          statusText: {
            fontSize: '14@ms',
            fontWeight: '600',
            paddingHorizontal: '12@ms',
            paddingVertical: '6@ms',
            borderRadius: '16@ms',
          },
          verifiedText: {
            color: Colors.white,
            backgroundColor: Colors.success,
          },
          rejectedText: {
            color: Colors.white,
            backgroundColor: Colors.error,
          },
          reuploadHint: {
            color: Colors.white,
            fontSize: '12@ms',
            marginTop: '4@ms',
            opacity: 0.8,
          },
          noDocumentsContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: '40@ms',
          },
          noDocumentsText: {
            fontSize: '16@ms',
            color: Colors.gray600,
            textAlign: 'center',
          },
          documentTypeHeader: {
            marginBottom: '12@ms',
            paddingBottom: '12@ms',
            borderBottomWidth: 1,
            borderBottomColor: Colors.gray200,
          },
          documentTypeTitle: {
            fontSize: '18@ms',
            fontWeight: '600',
            color: Colors.text,
            marginBottom: '4@ms',
          },
          documentTypeDescription: {
            fontSize: '14@ms',
            color: Colors.gray600,
            lineHeight: 20,
          },
          expiryDateText: {
            fontSize: '12@ms',
            color: Colors.gray500,
            marginTop: '4@ms',
            fontStyle: 'italic',
          },
          sideContainer: {
            marginBottom: '16@ms',
            padding: '12@ms',
            backgroundColor: Colors.backgroundCard,
            borderRadius: '8@ms',
            borderWidth: 1,
            borderColor: Colors.gray200,
          },
          sideLabel: {
            fontSize: '16@ms',
            fontWeight: '600',
            color: Colors.text,
            marginBottom: '8@ms',
            textTransform: 'capitalize',
          },
          sideStatus: {
            fontSize: '14@ms',
            fontWeight: '500',
            textTransform: 'capitalize',
          },
          sideStatusPending: {
            color: Colors.warning,
          },
          sideStatusVerified: {
            color: Colors.success,
          },
          sideStatusRejected: {
            color: Colors.error,
          },
          expiryDateSection: {
            marginBottom: '16@ms',
            padding: '12@ms',
            backgroundColor: Colors.backgroundCard,
            borderRadius: '8@ms',
            borderWidth: 1,
            borderColor: Colors.gray200,
          },
          expiryDatePickerContainer: {
            width: '100%',
          },
          expiryDateDisplay: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8@ms',
            padding: '12@ms',
            backgroundColor: Colors.success + '20',
            borderRadius: '8@ms',
          },
          expiryDateDisplayText: {
            flex: 1,
            fontSize: '14@ms',
            color: Colors.text,
            fontWeight: '500',
          },
          changeDateButton: {
            paddingHorizontal: '12@ms',
            paddingVertical: '6@ms',
            backgroundColor: Colors.primary,
            borderRadius: '6@ms',
          },
          changeDateText: {
            color: Colors.white,
            fontSize: '12@ms',
            fontWeight: '600',
          },
          setExpiryButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8@ms',
            padding: '12@ms',
            backgroundColor: Colors.warning + '20',
            borderRadius: '8@ms',
            borderWidth: 1,
            borderColor: Colors.warning,
          },
          setExpiryText: {
            fontSize: '14@ms',
            color: Colors.warning,
            fontWeight: '600',
          },
          expiryDateNote: {
            fontSize: '12@ms',
            color: Colors.gray500,
            marginTop: '8@ms',
            fontStyle: 'italic',
            textAlign: 'center',
          },
          // Text Input Document Styles
          textInputDocumentContainer: {
            backgroundColor: Colors.backgroundCard,
            borderRadius: '12@ms',
            padding: '16@ms',
            borderWidth: 1,
            borderColor: Colors.gray200,
          },
          textInputHeader: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: '16@ms',
            gap: '12@ms',
          },
          textInputTitleContainer: {
            flex: 1,
          },
          textInputWrapper: {
            marginBottom: '12@ms',
          },
          textInputField: {
            backgroundColor: Colors.background,
            borderWidth: 1,
            borderColor: Colors.gray300,
            borderRadius: '8@ms',
            padding: '14@ms',
            fontSize: '16@ms',
            color: Colors.text,
          },
          textInputFieldDisabled: {
            backgroundColor: Colors.gray100,
            color: Colors.gray500,
          },
          textInputSubmitButton: {
            backgroundColor: Colors.primaryLight,
            paddingVertical: '14@ms',
            paddingHorizontal: '24@ms',
            borderRadius: '8@ms',
            alignItems: 'center',
            justifyContent: 'center',
          },
          textInputSubmitButtonDisabled: {
            backgroundColor: Colors.gray400,
            opacity: 0.7,
          },
          textInputSubmitButtonText: {
            color: Colors.white,
            fontSize: '16@ms',
            fontWeight: '600',
          },
          verifiedBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.success,
            paddingHorizontal: '10@ms',
            paddingVertical: '4@ms',
            borderRadius: '12@ms',
            gap: '4@ms',
          },
          verifiedBadgeText: {
            color: Colors.white,
            fontSize: '12@ms',
            fontWeight: '600',
          },
          pendingBadge: {
            backgroundColor: Colors.warning,
            paddingHorizontal: '10@ms',
            paddingVertical: '4@ms',
            borderRadius: '12@ms',
          },
          pendingBadgeText: {
            color: Colors.white,
            fontSize: '12@ms',
            fontWeight: '600',
          },
          rejectedBadge: {
            backgroundColor: Colors.error,
            paddingHorizontal: '10@ms',
            paddingVertical: '4@ms',
            borderRadius: '12@ms',
          },
          rejectedBadgeText: {
            color: Colors.white,
            fontSize: '12@ms',
            fontWeight: '600',
          },
          rejectionReasonContainer: {
            backgroundColor: Colors.error + '15',
            padding: '12@ms',
            borderRadius: '8@ms',
            marginBottom: '12@ms',
            borderLeftWidth: 3,
            borderLeftColor: Colors.error,
          },
          rejectionReasonLabel: {
            fontSize: '12@ms',
            fontWeight: '600',
            color: Colors.error,
            marginBottom: '4@ms',
          },
          rejectionReasonText: {
            fontSize: '14@ms',
            color: Colors.text,
            lineHeight: 20,
          },
});
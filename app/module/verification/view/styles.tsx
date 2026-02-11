/**
 * VerificationCamera Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet } from '@app/styles';

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.black,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: '20@ms',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.background,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20@ms',
      backgroundColor: Colors.background,
    },
    permissionIcon: {
      marginBottom: '16@ms',
    },
    permissionTitle: {
      fontSize: '20@ms',
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: '8@ms',
      textAlign: 'center',
    },
    permissionText: {
      fontSize: '16@ms',
      color: Colors.gray600,
      textAlign: 'center',
      marginBottom: '24@ms',
    },
    permissionButton: {
      width: '200@ms',
    },
    instructionsContainer: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: '16@ms',
    },
    instructions: {
      color: Colors.white,
      fontSize: '16@ms',
      textAlign: 'center',
    },
    photoCountContainer: {
      marginTop: '12@ms',
      alignItems: 'center',
    },
    photoCountText: {
      fontSize: '12@ms',
      color: Colors.primary,
      fontWeight: '600',
    },
    proofPhotoCountText: {
      fontSize: '12@ms',
      color: Colors.success,
      fontWeight: '600',
      marginTop: '4@ms',
    },
    cameraContainer: {
      flex: 1,
      overflow: 'hidden',
    },
    camera: {
      flex: 1,
    },
    cameraOverlay: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'space-between',
      padding: '20@ms',
    },
    cameraControls: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    flipButton: {
      width: '50@ms',
      height: '50@ms',
      borderRadius: '25@ms',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    captureButton: {
      alignSelf: 'center',
      width: '70@ms',
      height: '70@ms',
      borderRadius: '35@ms',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '20@ms',
    },
    captureButtonInner: {
      width: '60@ms',
      height: '60@ms',
      borderRadius: '30@ms',
      backgroundColor: Colors.white,
    },
    previewContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    preview: {
      width: '100%',
      height: '80%',
      resizeMode: 'contain',
    },
    previewActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      padding: '20@ms',
    },
    previewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      paddingHorizontal: '20@ms',
      paddingVertical: '12@ms',
      borderRadius: '8@ms',
    },
    uploadButton: {
      backgroundColor: Colors.primary,
    },
    previewButtonText: {
      color: Colors.white,
      marginLeft: '8@ms',
      fontSize: '16@ms',
    },
    jobInfoContainer: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: '16@ms',
    },
    jobInfoTitle: {
      color: Colors.white,
      fontSize: '16@ms',
      fontWeight: '600',
      marginBottom: '4@ms',
    },
    jobInfoDetail: {
      color: Colors.white,
      fontSize: '14@ms',
    },
    // Multiple photos styles
    photosContainer: {
      flex: 1,
      padding: '16@ms',
    },
    photosHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16@ms',
    },
    photosTitle: {
      color: Colors.white,
      fontSize: '18@ms',
      fontWeight: '600',
    },
    photosTitleContainer: {
      flex: 1,
    },
    photosSubtitle: {
      fontSize: '12@ms',
      color: Colors.gray500,
      marginTop: '2@ms',
    },
    addMoreButton: {
      backgroundColor: Colors.primary,
      paddingHorizontal: '12@ms',
      paddingVertical: '6@ms',
      borderRadius: '6@ms',
    },
    addMoreButtonText: {
      color: Colors.white,
      fontSize: '14@ms',
      fontWeight: '500',
    },
    photosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: '20@ms',
      gap: '8@ms',
    },
    photoItem: {
      width: '30%',
      aspectRatio: 1,
      marginBottom: '10@ms',
      position: 'relative',
    },
    photoPreview: {
      width: '100%',
      height: '100%',
      borderRadius: '8@ms',
      resizeMode: 'cover',
    },
    removePhotoButton: {
      position: 'absolute',
      top: '4@ms',
      right: '4@ms',
      width: '24@ms',
      height: '24@ms',
      borderRadius: '12@ms',
      backgroundColor: 'rgba(255, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    removePhotoButtonText: {
      color: Colors.white,
      fontSize: '16@ms',
      fontWeight: 'bold',
    },
    commentContainer: {
      marginBottom: '20@ms',
    },
    commentLabel: {
      color: Colors.white,
      fontSize: '16@ms',
      fontWeight: '500',
      marginBottom: '8@ms',
    },
    commentInput: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '8@ms',
      padding: '12@ms',
      color: Colors.white,
      fontSize: '14@ms',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      minHeight: '80@ms',
    },
    // Proof photos styles
    proofPhotosContainer: {
      marginBottom: '20@ms',
      padding: '16@ms',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12@ms',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    proofPhotosHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12@ms',
    },
    proofPhotosTitle: {
      color: Colors.white,
      fontSize: '16@ms',
      fontWeight: '600',
    },
    proofPhotosTitleContainer: {
      flex: 1,
    },
    proofPhotosSubtitle: {
      fontSize: '12@ms',
      color: Colors.gray500,
      marginTop: '2@ms',
    },
    addProofButton: {
      backgroundColor: Colors.primary,
      paddingHorizontal: '12@ms',
      paddingVertical: '6@ms',
      borderRadius: '6@ms',
    },
    addProofButtonText: {
      color: Colors.white,
      fontSize: '14@ms',
      fontWeight: '500',
    },
    proofPhotosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: '12@ms',
      gap: '8@ms',
    },
    proofPhotoItem: {
      width: '30%',
      aspectRatio: 1,
      marginBottom: '10@ms',
      position: 'relative',
    },
    proofPhotoPreview: {
      width: '100%',
      height: '100%',
      borderRadius: '8@ms',
      resizeMode: 'cover',
    },
    removeProofPhotoButton: {
      position: 'absolute',
      top: '4@ms',
      right: '4@ms',
      width: '24@ms',
      height: '24@ms',
      borderRadius: '12@ms',
      backgroundColor: 'rgba(255, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeProofPhotoButtonText: {
      color: Colors.white,
      fontSize: '16@ms',
      fontWeight: 'bold',
    },
    clearProofButton: {
      alignSelf: 'center',
      paddingHorizontal: '12@ms',
      paddingVertical: '6@ms',
      backgroundColor: 'rgba(255, 0, 0, 0.2)',
      borderRadius: '6@ms',
      borderWidth: 1,
      borderColor: 'rgba(255, 0, 0, 0.5)',
    },
    clearProofButtonText: {
      color: Colors.error,
      fontSize: '12@ms',
      fontWeight: '500',
    },
    submitContainer: {
      paddingTop: '20@ms',
    },
    submitButton: {
      width: '100%',
    },
    submitButtonDisabled: {
      backgroundColor: Colors.gray500,
      opacity: 0.6,
    },
    submitHint: {
      fontSize: '12@ms',
      color: Colors.gray500,
      textAlign: 'center',
      marginTop: '8@ms',
    },
    noPhotoContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20@ms',
    },
    noPhotoText: {
      color: Colors.gray600,
      fontSize: '16@ms',
      marginTop: '16@ms',
      marginBottom: '8@ms',
      textAlign: 'center',
    },
    noPhotoSubtext: {
      fontSize: '14@ms',
      color: Colors.gray500,
      marginBottom: '24@ms',
      textAlign: 'center',
      lineHeight: 20,
    },
    selectPhotoButton: {
      width: '200@ms',
    },
    // Source selection styles
    sourceSelectionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20@ms',
    },
    sourceSelectionTitle: {
      color: Colors.white,
      fontSize: '20@ms',
      fontWeight: '600',
      marginBottom: '32@ms',
      textAlign: 'center',
    },
    sourceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: '24@ms',
      paddingVertical: '16@ms',
      borderRadius: '12@ms',
      marginBottom: '16@ms',
      width: '100%',
      maxWidth: '280@ms',
    },
    sourceButtonText: {
      color: Colors.white,
      fontSize: '16@ms',
      fontWeight: '500',
      marginLeft: '12@ms',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: '16@ms',
      paddingVertical: '12@ms',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    headerTitle: {
      color: Colors.white,
      fontSize: '18@ms',
      fontWeight: '600',
      marginLeft: '16@ms',
      flex: 1,
    },
  });

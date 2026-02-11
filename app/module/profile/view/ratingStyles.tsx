/**
 * Rating Screen Styles
 * @format
 */

import { StyleSheet } from "react-native";
import { Colors } from "@app/styles";

export const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 16,
      color: Colors.textSecondary,
    },
    
    // Summary Card
    summaryCard: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    averageRatingSection: {
      alignItems: "center",
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      marginBottom: 20,
    },
    averageRatingNumber: {
      fontSize: 48,
      fontWeight: "700",
      color: Colors.text,
      marginBottom: 8,
    },
    totalReviewsText: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginTop: 8,
    },
    
    // Stars
    starsContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    starIcon: {
      marginHorizontal: 2,
    },
    
    // Distribution Bars
    distributionSection: {
      gap: 8,
    },
    ratingBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    ratingBarLabel: {
      fontSize: 14,
      color: Colors.text,
      width: 30,
    },
    ratingBarTrack: {
      flex: 1,
      height: 8,
      backgroundColor: Colors.gray800,
      borderRadius: 4,
      overflow: "hidden",
    },
    ratingBarFill: {
      height: "100%",
      backgroundColor: Colors.warning,
      borderRadius: 4,
    },
    ratingBarCount: {
      fontSize: 14,
      color: Colors.textSecondary,
      width: 30,
      textAlign: "right",
    },
    
    // Write Review Button
    writeReviewButton: {
      backgroundColor: Colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      gap: 8,
    },
    writeReviewButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors.white,
    },
    
    // Reviews Section
    reviewsSection: {
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: Colors.text,
      marginBottom: 16,
    },
    
    // Review Card
    reviewCard: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    reviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    reviewerInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    reviewerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    reviewerAvatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    reviewerDetails: {
      flex: 1,
    },
    reviewerName: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors.text,
      marginBottom: 4,
    },
    reviewMetadata: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    reviewDate: {
      fontSize: 12,
      color: Colors.textSecondary,
    },
    jobTitle: {
      fontSize: 14,
      color: Colors.primary,
      marginBottom: 8,
      fontWeight: "500",
    },
    reviewComment: {
      fontSize: 14,
      color: Colors.textSecondary,
      lineHeight: 20,
    },
    
    // Empty State
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 16,
      color: Colors.textSecondary,
      marginTop: 16,
    },
    
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "flex-end",
    },
    modalContainer: {
      backgroundColor: Colors.backgroundCard,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: Colors.text,
    },
    modalSubtitle: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginTop: 4,
    },
    closeButton: {
      padding: 4,
    },
    modalContent: {
      padding: 20,
    },
    ratingLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors.text,
      marginBottom: 12,
    },
    commentLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors.text,
      marginTop: 24,
      marginBottom: 12,
    },
    commentInput: {
      backgroundColor: Colors.background,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: Colors.text,
      minHeight: 120,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: 24,
    },
    submitButton: {
      backgroundColor: Colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors.white,
    },
  });


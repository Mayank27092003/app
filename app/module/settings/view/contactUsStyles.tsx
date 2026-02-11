/**
 * Contact Us Screen Styles
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
    mainTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: Colors.text,
      marginBottom: 24,
    },
    contactItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 24,
      paddingBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    contactInfo: {
      flex: 1,
      justifyContent: "center",
    },
    contactLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors.text,
      marginBottom: 4,
    },
    contactValue: {
      fontSize: 16,
      color: Colors.textSecondary,
      lineHeight: 24,
    },
    businessHoursCard: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 16,
      padding: 20,
      marginTop: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    businessHoursHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    businessHoursTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: Colors.text,
      marginLeft: 12,
    },
    hoursContainer: {
      gap: 16,
    },
    hourRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dayText: {
      fontSize: 16,
      color: Colors.text,
      fontWeight: "500",
    },
    timeText: {
      fontSize: 16,
      color: Colors.textSecondary,
      fontWeight: "400",
    },
    closedText: {
      fontSize: 16,
      color: Colors.textSecondary,
      fontWeight: "400",
    },
    additionalInfo: {
      backgroundColor: Colors.backgroundCard,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: Colors.primary,
    },
    additionalInfoText: {
      fontSize: 14,
      color: Colors.textSecondary,
      lineHeight: 20,
      textAlign: "center",
    },
  });


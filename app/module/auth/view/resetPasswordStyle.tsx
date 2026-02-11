import { StyleSheet } from "react-native";
import { ScaledSheet } from "react-native-size-matters";
import { Colors, ITheme } from "@app/styles";

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    container: {
      flex: 1,
    },
    overlay: 
    {backgroundColor:'rgba(0, 0, 0, 0.9)',position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
  },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: "24@ms",
    },
    header: {
      paddingTop: "30@ms",
      paddingHorizontal: "24@ms",
    },
    backButton: {
      width: "40@ms",
      height: "40@ms",
      borderRadius: "20@ms",
      backgroundColor: Colors.backgroundCard,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      marginBottom: "24@ms",
    },
    logoContainer: {
      alignItems: "center",
    },
    logoImage: {
      width: "130@ms",
      height: "130@ms",
      borderRadius: "20@ms",
    },
    formContainer: {
      padding: "24@ms",
    },
    title: {
      fontSize: "28@ms",
      fontWeight: "bold",
      color: Colors.text,
      marginBottom: "8@ms",
      textAlign: "center",
    },
    subtitle: {
      fontSize: "16@ms",
      color: Colors.white,
      marginBottom: "32@ms",
      textAlign: "center",
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.error + "15",
      padding: "12@ms",
      borderRadius: "8@ms",
      marginBottom: "16@ms",
    },
    errorIcon: {
      marginRight: "8@ms",
    },
    errorText: {
      color: Colors.error,
      fontSize: "14@ms",
      flex: 1,
    },
    loginButton: {
      marginTop: "24@ms",
    },
  });

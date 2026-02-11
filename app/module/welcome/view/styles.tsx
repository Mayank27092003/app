/**
 * Welcome Styles
 * @format
 */

import { Colors, ITheme, ScaledSheet } from "@app/styles";

export const getStyles = (theme: ITheme) =>
  ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    background: {
      // height: '10%',
      position: "relative",
      // backgroundColor:'red'
    },
    backgroundImage: {
      ...ScaledSheet.absoluteFillObject,
      opacity: 0.7,
    },
    overlay: {
      ...ScaledSheet.absoluteFillObject,
    },
    languageContainer: {
      position: "absolute",
      top: "50@ms",
      right: "20@ms",
      zIndex: 10,
    },
    logo: {
      height: "150@ms",
      width: "150@ms",
            borderRadius: '30@ms',

    },
    logoContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    logoCircle: {
      width: "100@ms",
      height: "100@ms",
      borderRadius: "50@ms",
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: "2@ms",
      borderColor: Colors.primary,
    },
    appName: {
      fontSize: "32@ms",
      fontWeight: "bold",
      color: Colors.white,
      // marginTop: '16@ms',
    },
    tagline: {
      fontSize: "16@ms",
      color: Colors.white,
      opacity: 0.9,
      // marginTop: '8@ms',
    },
    content: {
      flex: 1,
      // height:'70%',
      paddingHorizontal: "24@ms",
      paddingVertical: "20@ms",
      // marginTop: "10@ms",
      // backgroundColor:'red'
    },
    welcomeTitle: {
      fontSize: "24@ms",
      fontWeight: "bold",
      color: Colors.white,
      marginBottom: "12@ms",
    },
    welcomeText: {
      fontSize: "16@ms",
      color: Colors.textSecondary,
      marginBottom: "14@ms",
      lineHeight: "24@ms",
    },
    featuresContainer: {
      // marginTop: '4@ms',
    },
    featureItem: {
      flexDirection: "row",
      marginBottom: "12@ms",
      alignItems: "center",
    },
    featureIconContainer: {
      width: "48@ms",
      height: "48@ms",
      borderRadius: "24@ms",
      backgroundColor: Colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
      marginRight: "16@ms",
    },
    featureTextContainer: {
      flex: 1,
    },
    featureTitle: {
      fontSize: "16@ms",
      fontWeight: "600",
      color: Colors.white,
      marginBottom: "4@ms",
    },
    featureDescription: {
      fontSize: "14@ms",
      color: Colors.textSecondary,
      lineHeight: "20@ms",
    },
    footer: {
      padding: "24@ms",
      paddingBottom: "26@ms",
    },
    signInButton: {
      // marginBottom: "16@ms",
    },
    registerButton: {
      alignItems: "center",
      padding: "8@ms",
    },
    registerText: {
      fontSize: "14@ms",
      color: Colors.textSecondary,
    },
    registerTextBold: {
      fontWeight: "600",
      color: Colors.primary,
    },
   
    slide: {
      flex: 1,
      backgroundColor: Colors.black,
    },
    image: {
      width: "100%",
      height: "70%",
      borderBottomLeftRadius: "30@ms",
      borderBottomRightRadius: "30@ms",
    },
    bottomContent: {
      position: "absolute",
      bottom: "100@ms",
      left: 0,
      right: 0,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: "10@ms",
      zIndex: 5,
    },
    title: {
      color: Colors.white,
      fontSize: "18@ms",
      fontWeight: "700",
      textAlign: "center",
      marginBottom: "16@ms",
      paddingHorizontal: "20@ms",
      // lineHeight: "34@ms",
    },
    description: {
      color: Colors.textSecondary,
      fontSize: "14@ms",
      textAlign: "center",
      paddingHorizontal: "20@ms",
      marginBottom: "10@ms",
    },
    dot: {
      width: "8@ms",
      height: "8@ms",
      borderRadius: "4@ms",
      backgroundColor: "#444",
      marginHorizontal: "4@ms",
    },
    activeDot: {
      width: "25@ms",
      height: "8@ms",
      borderRadius: "4@ms",
      backgroundColor: Colors.primary,
      marginHorizontal: "4@ms",
    },
    buttonContainer: {
      paddingHorizontal: "20@ms",
      // paddingBottom: "40@ms",
      paddingTop: "10@ms",
    },
  });

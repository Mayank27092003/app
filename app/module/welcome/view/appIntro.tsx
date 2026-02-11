import React, { useRef, useState } from "react";
import { View, Text, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AppIntroSlider from "react-native-app-intro-slider";
import { Button } from "@app/components/Button";
import { useTranslation } from "react-i18next";
import { Routes } from "@app/navigator";
import { useThemedStyle } from "@app/styles";
import { getStyles } from "./styles";
import { LanguageSelector } from "@app/components";
import { markIntroAsSeen } from "@app/utils/welcomeUtils";

const slides = [
  {
    key: 1,
    title: "Get Latest And Updated News Easily With Us!",
    text: "Get the latest updates on the most popular and hot news with us",
    image: require("../../../assets/truck5.jpeg"),
  },
  {
    key: 2,
    title: "Stay Informed With Real-Time Alerts",
    text: "Never miss breaking news and events around the world",
    image: require("../../../assets/truck6.jpeg"),
  },
  {
    key: 3,
    title: "Your Trusted Source for News",
    text: "We bring verified and unbiased news directly to you",
    image: require("../../../assets/truck3.jpg"),
  },
];

export function AppIntro() {
  const navigation = useNavigation();
  const styles = useThemedStyle(getStyles);
  const { t } = useTranslation();

  const sliderRef = useRef(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <View style={styles.languageContainer}>
        <LanguageSelector />
      </View>
      <Image source={item.image} style={styles.image} resizeMode="cover" />
      <View style={styles.bottomContent}>
        <Text style={styles.title} numberOfLines={3} adjustsFontSizeToFit>
          {item.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  const onDone = async () => {
    try {
      // Save that user has seen the intro
      await markIntroAsSeen();
      
      // Navigate to login screen
      navigation.navigate(Routes.LoginScreen as never);
    } catch (error) {
      console.error('Error saving intro preference:', error);
      // Still navigate even if saving fails
      navigation.navigate(Routes.LoginScreen as never);
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      sliderRef.current?.goToSlide(currentSlideIndex + 1, true);
    }
  };

  const renderNextButton = () => (
    <View style={styles.buttonContainer}>
      <Button title={t("common.next")} onPress={handleNext} fullWidth />
    </View>
  );

  const renderDoneButton = () => (
    <View style={styles.buttonContainer}>
      <Button title={t("common.getStarted")} onPress={onDone} fullWidth />
    </View>
  );

  return (
    <View style={styles.container}>
      <AppIntroSlider
        ref={sliderRef}
        data={slides}
        renderItem={renderItem}
        renderNextButton={renderNextButton}
        renderDoneButton={renderDoneButton}
        onSlideChange={(index) => setCurrentSlideIndex(index)}
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
        bottomButton
      />
    </View>
  );
}

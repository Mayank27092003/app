/**
 * Contact Us Screen
 * @format
 */

import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { Mail, Phone, MapPin, Clock } from "lucide-react-native";
import { Colors, useThemedStyle } from "@app/styles";
import { getStyles } from "./contactUsStyles";
import Header from "@app/components/Header";

export default function ContactUsScreen() {
  const styles = useThemedStyle(getStyles);

  const handleEmailPress = () => {
    Linking.openURL("mailto:support@logisticspro.com");
  };

  const handlePhonePress = () => {
    Linking.openURL("tel:+15551234567");
  };

  const handleAddressPress = () => {
    const address = "123 Logistics Ave, Transport City, TC 12345";
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
  };

  return (
    <View style={styles.container}>
      <Header title="Contact Us" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>Contact Information</Text>

        {/* Email Section */}
        <View style={styles.contactItem}>
          <View style={styles.iconContainer}>
            <Mail size={24} color={Colors.white} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Email</Text>
            <TouchableOpacity onPress={handleEmailPress}>
              <Text style={styles.contactValue}>support@logisticspro.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Phone Section */}
        <View style={styles.contactItem}>
          <View style={styles.iconContainer}>
            <Phone size={24} color={Colors.white} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Phone</Text>
            <TouchableOpacity onPress={handlePhonePress}>
              <Text style={styles.contactValue}>+1 (555) 123-4567</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.contactItem}>
          <View style={styles.iconContainer}>
            <MapPin size={24} color={Colors.white} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Address</Text>
            <TouchableOpacity onPress={handleAddressPress}>
              <Text style={styles.contactValue}>
                123 Logistics Ave, Transport City, TC 12345
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Business Hours Card */}
        <View style={styles.businessHoursCard}>
          <View style={styles.businessHoursHeader}>
            <Clock size={24} color={Colors.primary} />
            <Text style={styles.businessHoursTitle}>Business Hours</Text>
          </View>

          <View style={styles.hoursContainer}>
            <View style={styles.hourRow}>
              <Text style={styles.dayText}>Monday - Friday:</Text>
              <Text style={styles.timeText}>8:00 AM - 6:00 PM</Text>
            </View>

            <View style={styles.hourRow}>
              <Text style={styles.dayText}>Saturday:</Text>
              <Text style={styles.timeText}>9:00 AM - 4:00 PM</Text>
            </View>

            <View style={styles.hourRow}>
              <Text style={styles.dayText}>Sunday:</Text>
              <Text style={styles.closedText}>Closed</Text>
            </View>
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.additionalInfo}>
          <Text style={styles.additionalInfoText}>
            For urgent matters, please call us during business hours. For general inquiries, 
            email us and we'll respond within 24 hours.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}


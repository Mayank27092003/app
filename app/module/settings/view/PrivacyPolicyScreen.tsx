import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";

//Screens
import { Colors, useThemedStyle } from "@app/styles";
import { getStyles } from "./styles";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Header from "@app/components/Header";
export default function PrivacyPolicyScreen() {
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
            <Header title={t("auth.register.privacyPolicy")} />

      {/* <View style={styles.headerBack}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("auth.register.privacyPolicy")}</Text>
        <TouchableOpacity style={[styles.filterButton]}></TouchableOpacity>
      </View> */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* <Text style={styles.title}>Privacy Policy</Text> */}
        <Text style={styles.date}>Last Updated: June 7, 2025</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to GoFRTS, a platform connecting truck drivers with
            carriers, brokers, shippers, and intermodal companies. These Terms
            and Conditions govern your use of the GoFRTS mobile
            application and related services.
          </Text>
          <Text style={styles.paragraph}>
            By using GoFRTS, you agree to these Terms and Conditions. If
            you do not agree, please do not use the application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Definitions</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Driver"</Text> refers to individuals who
            provide transportation services through the GoFRTS platform.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Merchant"</Text> refers to carriers,
            brokers, shippers, or intermodal companies that post jobs on the
            GoFRTS platform.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Job"</Text> refers to a transportation
            service request posted by a Merchant.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Driver Responsibilities</Text>
          <Text style={styles.paragraph}>Drivers are responsible for:</Text>
          <Text style={styles.listItem}>
            • Maintaining valid commercial driver's licenses and required
            certifications
          </Text>
          <Text style={styles.listItem}>
            • Ensuring their vehicles meet all safety and regulatory
            requirements
          </Text>
          <Text style={styles.listItem}>
            • Uploading pre-trip and post-trip inspection photos for each job
          </Text>
          <Text style={styles.listItem}>
            • Complying with all applicable transportation laws and regulations
          </Text>
          <Text style={styles.listItem}>
            • Maintaining appropriate insurance coverage
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>
              Drivers are responsible for any damages
            </Text>{" "}
            that occur during transport. GoFRTS strongly recommends that
            Drivers thoroughly document the condition of cargo before and after
            transport.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Merchant Responsibilities</Text>
          <Text style={styles.paragraph}>Merchants are responsible for:</Text>
          <Text style={styles.listItem}>
            • Providing accurate and complete information about jobs
          </Text>
          <Text style={styles.listItem}>
            • Ensuring cargo is properly prepared for transport
          </Text>
          <Text style={styles.listItem}>
            • Providing necessary documentation for transport
          </Text>
          <Text style={styles.listItem}>
            • Promptly paying for completed services
          </Text>
          <Text style={styles.listItem}>
            • Maintaining appropriate insurance coverage
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Payments and Fees</Text>
          <Text style={styles.paragraph}>
            All payments for services are processed through the GoFRTS
            platform. GoFRTS charges a commission on each transaction,
            which is collected from both Drivers and Merchants.
          </Text>
          <Text style={styles.paragraph}>
            Payment terms and commission rates are specified in the separate
            Payment Terms document, which is incorporated by reference into
            these Terms and Conditions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Cancellation Policy</Text>
          <Text style={styles.paragraph}>
            Jobs may be cancelled by either party subject to the following
            conditions:
          </Text>
          <Text style={styles.listItem}>
            • Cancellations more than 24 hours before the scheduled pickup time:
            No penalty
          </Text>
          <Text style={styles.listItem}>
            • Cancellations less than 24 hours before the scheduled pickup time:
            Cancellation fee may apply
          </Text>
          <Text style={styles.listItem}>
            • Cancellations after the Driver has arrived at the pickup location:
            Compensation for Driver's time and travel may apply
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
          GoFRTS serves as a platform connecting Drivers and Merchants
            and is not responsible for the actions or omissions of either party.
            GoFRTS does not guarantee the quality, safety, or legality of
            jobs or services.
          </Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by law, GoFRTS's liability is
            limited to the amount of fees collected for the specific job in
            question.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Dispute Resolution</Text>
          <Text style={styles.paragraph}>
            Any disputes between Drivers and Merchants should first be addressed
            through GoFRTS's dispute resolution process. If the dispute
            cannot be resolved through this process, the parties agree to
            binding arbitration.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Modifications to Terms</Text>
          <Text style={styles.paragraph}>
          GoFRTS reserves the right to modify these Terms and Conditions
            at any time. Users will be notified of significant changes, and
            continued use of the platform constitutes acceptance of the modified
            terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms and Conditions, please
            contact us at:
          </Text>
          <Text style={styles.paragraph}>
          GoFRTS, Inc. 123 Logistics Way San Francisco, CA 94103
            support@GoFRTS.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export { PrivacyPolicyScreen };

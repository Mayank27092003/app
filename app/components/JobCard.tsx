/**
 * JobCard Screen
 * @format
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  MapPin,
  Calendar,
  Truck,
  DollarSign,
  ArrowRight,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

//Screens
import { Colors, ScaledSheet } from "@app/styles";
import { Job } from "../types";
import { Routes } from "@app/navigator";
import { useAuthStore } from "@app/store/authStore";
import { useTranslation } from "react-i18next";

interface JobCardProps {
  job: Job;
  onPress?: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  console.log(job, "jobbbbb");
  const navigation = useNavigation();
  const { userRole } = useAuthStore();
  const { t } = useTranslation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate(Routes.JobDetailsScreen, { jobId: job?.id });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "posted":
      case "draft":
        return Colors.primary;
      case "active":
        return Colors.primary;
      case "assigned":
        return Colors.warning;
      case "in_progress":
      case "arrived_pickup":
      case "loaded":
      case "in_transit":
      case "arrived_delivery":
        return Colors.primaryDark;
      case "delivered":
      case "completed":
        return Colors.success;
      case "cancelled":
        return Colors.error;
      default:
        return Colors.gray500;
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View

        style={styles.card}

      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {job.title}
            </Text>
            <Text style={styles.jobId}>{t("jobs.jobId")}-{String(job.id)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: getStatusColor(job.status) + "30",
                borderColor: getStatusColor(job.status),
              },
            ]}
          >
            <Text
              style={[styles.statusText, { color: getStatusColor(job.status) }]}
            >
              {formatStatus(job.status)}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MapPin size={16} color={Colors.primary} style={styles.icon} />
            <View style={{}}>
              <Text style={styles.infoLabel}>{t("jobs.pickup")}</Text>
              <Text style={styles.infoText} numberOfLines={2}>
                {job.pickupLocation?.address},
                {job.pickupLocation?.city || job.pickup?.city}, {job.pickupLocation?.state || job.pickup?.state}
              </Text>
            </View>
          </View>

          <View style={styles.arrow}>
            <ArrowRight size={18} color={Colors.textSecondary} />
          </View>

          <View style={styles.infoItem}>
            <MapPin size={16} color={Colors.primary} style={styles.icon} />
            <View>
              <Text style={styles.infoLabel}>{t("jobs.delivery")}</Text>
              <Text style={styles.infoText} numberOfLines={2}>
                {job.dropoffLocation?.address},

                {job.dropoffLocation?.city || job.dropoff?.city}, {job.dropoffLocation?.state || job.dropoff?.state}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Calendar
              size={14}
              color={Colors.textSecondary}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>
              {job.pickupLocation?.date || job.pickup?.date || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Truck
              size={14}
              color={Colors.textSecondary}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>
              {job?.cargo?.cargoType || 'NA'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            {/* <DollarSign
              size={14}
              color={Colors.textSecondary}
              style={styles.detailIcon}
            /> */}
            <Text style={styles.detailText}>
              ${job.payAmount || job.compensation || '0'} {job.currency || 'USD'}
            </Text>
          </View>
          {userRole === "driver" && (
            <View style={styles.detailItem}>
              <DollarSign
                size={14}
                color={Colors.textSecondary}
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>

                {job.pricePerMile || 'NA'}/{t("jobs.miles")}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.merchantInfo}>
            <Text style={styles.merchantName}>
              {job.company?.companyName || job.merchantName || 'Company Name'}
            </Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>
                {(job.merchantRating || 0).toFixed(1)}
              </Text>
              <Text style={styles.ratingIcon}>★</Text>
            </View>
          </View>

          <Text style={styles.distanceText}>
            {(job?.cargo?.distance || 0).toFixed(1)}  {t("jobs.miles")} • {job?.cargo?.estimatedDuration || 'N/A'}
          </Text>
        </View>

        {job.status === "in_transit" && (
          <View style={styles.trackingTag}>
            <Text style={styles.trackingTagText}>
              Job ID- {String(job.id).substring(1, 8)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = ScaledSheet.create({
  cardContainer: {
    marginBottom: "16@ms",
    borderRadius: "12@ms",
    overflow: "hidden",
  },
  card: {
    padding: "16@ms",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: "12@ms",
    position: "relative",
    backgroundColor: Colors.backgroundCard,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12@ms",
  },
  titleContainer: {
    flex: 1,
    marginRight: "8@ms",
  },
  title: {
    fontSize: "16@ms",
    fontWeight: "600",
    color: Colors.white,
    marginBottom: "2@ms",
  },
  jobId: {
    fontSize: "15@ms",
    fontWeight: "500",
    color: Colors.primary,
    opacity: 0.8,
  },
  statusBadge: {
    paddingHorizontal: "8@ms",
    paddingVertical: "4@ms",
    borderRadius: "4@ms",
    borderWidth: 1,
  },
  statusText: {
    fontSize: "12@ms",
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: "12@ms",
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  arrow: {
    marginHorizontal: "4@ms",
    paddingHorizontal: "4@ms",
  },
  icon: {
    marginRight: "6@ms",
    marginTop: "2@ms",
  },
  infoLabel: {
    fontSize: "12@ms",
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoText: {
    fontSize: "14@ms",
    color: Colors.white,
    fontWeight: "500",
    paddingRight: '10@ms'
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: "12@ms",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: "12@ms",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    marginRight: "4@ms",
  },
  detailText: {
    fontSize: "13@ms",
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  merchantInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  merchantName: {
    fontSize: "14@ms",
    fontWeight: "500",
    color: Colors.white,
    marginRight: "8@ms",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: "6@ms",
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: "12@ms",
    fontWeight: "600",
    color: Colors.white,
  },
  ratingIcon: {
    fontSize: "12@ms",
    color: Colors.warning,
    marginLeft: 2,
  },
  distanceText: {
    fontSize: "13@ms",
    color: Colors.textSecondary,
  },
  trackingTag: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: "8@ms",
    paddingVertical: "4@ms",
    borderBottomLeftRadius: "8@ms",
  },
  trackingTagText: {
    color: Colors.white,
    fontSize: "12@ms",
    fontWeight: "600",
  },
});

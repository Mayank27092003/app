/**
 * Job Bids Screen
 * @format
 */

import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StatusBar } from "react-native";
import {
  MapPin,
  Calendar,
  Clock,
  Star,
  MessageCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Filter,
} from "lucide-react-native";

//Screens
import { Colors, useThemedStyle } from "@app/styles";
import { useAuthStore } from "@app/store/authStore";
import { Button } from "@app/components/Button";
import { formatCurrency } from "@app/utils/formatters";
import { getStyles } from "./jobBidsStyles";
import { Routes } from "@app/navigator";
import { useTranslation } from "react-i18next";
import Header from "@app/components/Header";
import { useDispatch, useSelector } from "react-redux";
import { selectProfile, selectCurrentJob, selectLoader } from "@app/module/common";
import { fetchJobById, fetchJobBids, acceptBid, rejectBid } from "@app/module/jobs/slice";
import { useFocusEffect } from "@react-navigation/native";

function JobBidsScreen({ navigation, route }) {
  const styles = useThemedStyle(getStyles);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const profileData = useSelector(selectProfile);
  const { jobId } = route.params || {};
  const job = useSelector(selectCurrentJob);
  const isLoading = useSelector(selectLoader);

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  console.log("JobBidsScreen - Route params:", route.params);
  console.log("JobBidsScreen - Job ID:", jobId);
  console.log("JobBidsScreen - Job:", job);

  const userRole = profileData?.roles?.[0]?.role?.name;

  // Fetch job by ID and job bids when component mounts or jobId changes
  useFocusEffect(
    useCallback(() => {
      if (jobId) {
        dispatch(fetchJobById({ id: jobId }));
        dispatch(fetchJobBids({ jobId: jobId }));
      }
    }, [dispatch, jobId])
  );

  // Mock data for testing
  const mockBids = [
    {
      id: 1,
      companyName: "FastTrack Logistics",
      role: "carrier",
      rating: 4.8,
      status: "pending",
      proposedRate: "180.00",
      estimatedDuration: "2.5 hours",
      coverLetter: "We have extensive experience in electronics transportation and can ensure safe delivery.",
      appliedAt: new Date().toISOString(),
    },
    {
      id: 2,
      companyName: "Reliable Transport Co.",
      role: "driver",
      rating: 4.5,
      status: "accepted",
      proposedRate: "160.00",
      estimatedDuration: "3 hours",
      coverLetter: "Professional driver with clean record and specialized equipment for fragile goods.",
      appliedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      companyName: "QuickMove Services",
      role: "carrier",
      rating: 4.2,
      status: "rejected",
      proposedRate: "200.00",
      estimatedDuration: "2 hours",
      coverLetter: "Premium service with insurance coverage and real-time tracking.",
      appliedAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  // Filter bids based on selected status
  const getFilteredBids = () => {
    const bids = job?.jobApplications || mockBids;
    console.log("getFilteredBids - bids:", bids);
    if (selectedFilter === 'all') {
      return bids;
    }
    
    return bids.filter(bid => bid.status === selectedFilter);
  };

  const getBidCounts = () => {
    const bids = job?.jobApplications || mockBids;
    
    const counts = {
      all: bids.length,
      pending: bids.filter(bid => bid.status === 'pending').length,
      accepted: bids.filter(bid => bid.status === 'accepted').length,
      rejected: bids.filter(bid => bid.status === 'rejected').length,
    };
    
    return counts;
  };

  const handleAcceptBid = (bidId: number) => {
    if (!job) {
      Alert.alert(t("common.error"), t("common.jobDataNotLoaded"));
      return;
    }
    
    Alert.alert(
      t("common.acceptBid") || "Accept Bid",
      t("common.acceptBidConfirm") || "Are you sure you want to accept this bid?",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.accept") || "Accept",
          onPress: () => {
            dispatch(acceptBid({ 
              bidId,
              onSuccess: (response) => {
                // Navigate back after successful acceptance
                setTimeout(() => {
                  navigation.goBack();
                }, 1500); // Small delay to show success message
              },
              onError: (error) => {
                console.error("Error accepting bid:", error);
              }
            }));
          }
        }
      ]
    );
  };

  const handleRejectBid = (bidId: number) => {
    if (!job) {
      Alert.alert(t("common.error"), t("common.jobDataNotLoaded"));
      return;
    }
    
    Alert.alert(
      t("common.rejectBid") || "Reject Bid",
      t("common.rejectBidConfirm") || "Are you sure you want to reject this bid?",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.reject") || "Reject",
          onPress: () => {
            dispatch(rejectBid({ 
              bidId,
              onSuccess: (response) => {
                // Navigate back after successful rejection
                setTimeout(() => {
                  navigation.goBack();
                }, 1500); // Small delay to show success message
              },
              onError: (error) => {
                console.error("Error rejecting bid:", error);
              }
            }));
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return Colors.warning;
      case "accepted":
        return Colors.success;
      case "rejected":
        return Colors.error;
      default:
        return Colors.gray500;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={12} color={Colors.warning} />;
      case "accepted":
        return <CheckCircle size={12} color={Colors.success} />;
      case "rejected":
        return <XCircle size={12} color={Colors.error} />;
      default:
        return <Clock size={12} color={Colors.gray500} />;
    }
  };

  const calculateBidDifference = (proposedRate: string) => {
    const originalAmount = parseFloat(job?.payAmount?.toString() || job?.compensation?.toString() || "0");
    const bidAmount = parseFloat(proposedRate || "0");
    const difference = bidAmount - originalAmount;
    
    if (difference > 0) {
      return `+${formatCurrency(difference, job?.currency || "USD")} above original`;
    } else if (difference < 0) {
      return `${formatCurrency(Math.abs(difference), job?.currency || "USD")} below original`;
    } else {
      return "Same as original rate";
    }
  };

  const renderFilterTabs = () => {
    const counts = getBidCounts();
    
    const filters = [
      { key: 'all', label: 'All', count: counts.all },
      { key: 'pending', label: 'Pending', count: counts.pending },
      { key: 'accepted', label: 'Accepted', count: counts.accepted },
      { key: 'rejected', label: 'Rejected', count: counts.rejected },
    ];

    return (
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                selectedFilter === filter.key && styles.filterTabActive
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === filter.key && styles.filterTabTextActive
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Helper function to get bidder name from various possible fields
  const getBidderName = (bid: any): string => {
    // Try various possible fields for name
    return bid?.user?.userName || 
           bid?.user?.name || 
           bid?.userName ||
           bid?.name ||
           bid?.driverName ||
           bid?.companyName ||
           `${bid?.user?.firstName || ''} ${bid?.user?.lastName || ''}`.trim() ||
           `Bidder #${bid.id || 'Unknown'}`;
  };

  // Helper function to get bidder role from various possible fields
  const getBidderRole = (bid: any): string => {
    // Try various possible fields for role
    return bid?.user?.roles?.[0]?.role?.name ||
           bid?.role ||
           bid?.userRole ||
           bid?.user?.role ||
           'BIDDER';
  };

  const renderBidCard = (bid: any, index: number) => {
    const isPending = bid.status === 'pending';
    const canTakeAction = userRole === 'shipper' || userRole === 'carrier' || userRole === 'broker';
    const bidderName = getBidderName(bid);
    const bidderRole = getBidderRole(bid);
    
    return (
      <View key={bid.id || index} style={styles.bidCard}>
        <View style={styles.bidCardHeader}>
          <View style={styles.bidCardHeaderLeft}>
            <Text style={styles.bidCompanyName}>
              {bidderName}
            </Text>
            <View style={styles.bidRoleTag}>
              <Text style={styles.bidRoleText}>
                {bidderRole.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.bidCardHeaderRight}>
            <View style={styles.bidRating}>
              <Star size={12} color={Colors.warning} fill={Colors.warning} />
              <Text style={styles.bidRatingText}>
                {bid.rating?.toFixed(1) || '4.5'}
              </Text>
            </View>
            <View style={[styles.bidStatus, { backgroundColor: getStatusColor(bid.status) + '20' }]}>
              {getStatusIcon(bid.status)}
              <Text style={[styles.bidStatusText, { color: getStatusColor(bid.status) }]}>
                {bid.status?.charAt(0).toUpperCase() + bid.status?.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bidAmountContainer}>
          <Text style={styles.bidAmount}>
            {formatCurrency(
              parseFloat(bid.proposedRate?.toString() || "0"),
              job?.currency || "USD"
            )}
          </Text>
          <Text style={styles.bidDifference}>
            {calculateBidDifference(bid.proposedRate?.toString() || "0")}
          </Text>
        </View>

        <View style={styles.bidDetails}>
          <View style={styles.bidDetailItem}>
            <Clock size={14} color={Colors.textSecondary} />
            <Text style={styles.bidDetailText}>
              {bid.estimatedDuration || '2.5 hours'}
            </Text>
          </View>
          
          {bid.coverLetter && (
            <View style={styles.bidDetailItem}>
              <MessageCircle size={14} color={Colors.textSecondary} />
              <Text style={styles.bidDetailText} numberOfLines={2}>
                {bid.coverLetter}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bidFooter}>
          <Text style={styles.bidDate}>
            Submitted {new Date(bid.appliedAt).toLocaleDateString()} at {new Date(bid.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          
          {isPending && canTakeAction && (
            <View style={styles.bidActions}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectBid(bid.id)}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptBid(bid.id)}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!job) {
    return (
      <View style={styles.container}>
        <Header title="Job Bids" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {isLoading ? "Loading job details..." : "Job not found"}
          </Text>
          {!isLoading && (
            <Button
              title="Go Back"
              variant="outline"
              onPress={() => navigation.goBack()}
            />
          )}
        </View>
      </View>
    );
  }

  const filteredBids = getFilteredBids();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Header title="Job Bids" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={styles.jobRoute}>
            <MapPin size={16} color={Colors.textSecondary} />
            <Text style={styles.jobRouteText}>
              {job.pickupLocation?.city || 'Pickup'}, {job.pickupLocation?.state || 'State'} → {job.dropoffLocation?.city || 'Delivery'}, {job.dropoffLocation?.state || 'State'}
            </Text>
          </View>
          <View style={styles.jobRateContainer}>
            <Text style={styles.originalRateLabel}>Original Rate:</Text>
            <Text style={styles.originalRateAmount}>
              {formatCurrency(
                parseFloat(job.payAmount?.toString() || job.compensation?.toString() || "0"),
                job.currency || "USD"
              )}
            </Text>
          </View>
          <Text style={styles.bidCount}>
            {(job.jobApplications || mockBids).length} bids received
          </Text>
        </View>

        {/* Filter Tabs */}
        {renderFilterTabs()}


        {/* Bids List */}
        <View style={styles.bidsList}>
          {filteredBids.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No {selectedFilter === 'all' ? '' : selectedFilter} bids found
              </Text>
            </View>
          ) : (
            filteredBids.map((bid, index) => renderBidCard(bid, index))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export { JobBidsScreen };

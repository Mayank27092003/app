import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";

// Screens
import { Colors, useThemedStyle } from "@app/styles";
import { selectJobs, selectLoader } from "@app/module/common";
import { fetchTrackingContracts } from "@app/module/jobs/slice";
import { JobCard } from "@app/components/JobCard";
import { Button } from "@app/components/Button";

import { getStyles } from "./styles";
import { Routes } from "../../../navigator";

function TrackingScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Redux state
  const jobs = useSelector(selectJobs);
  const isLoading = useSelector(selectLoader);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);

  // Fetch tracking contracts when component mounts
  useEffect(() => {
    console.log('Tracking screen mounted, fetching tracking contracts');
    dispatch(fetchTrackingContracts());
  }, [dispatch]);

  // Refresh tracking contracts when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Tracking screen focused, refreshing tracking contracts');
      dispatch(fetchTrackingContracts());
    }, [dispatch])
  );

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(fetchTrackingContracts());
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Handle job selection
  const handleJobSelect = (job: any) => {
    console.log('Selected job:', job);
    // Navigate to job details or trip tracking
    (navigation as any).navigate(Routes.TripTrackingScreen, { job });
  };

  // Render job item
  const renderJobItem = ({ item }: { item: any }) => (
    <JobCard
      job={item}
      onPress={() => handleJobSelect(item)}
    />
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{t("common.noContractJobs")}</Text>
      <Text style={styles.emptySubtitle}>
        {t("common.noContractJobsDescription")}
      </Text>
      <Button
        title={t("buttons.refresh")}
        onPress={handleRefresh}
        style={styles.refreshButton}
      />
    </View>
  );

  // Render loading state
  if (isLoading && !jobs.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t("common.loadingContractJobs")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("common.liveTrips")}</Text>
        
      </View>

      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id?.toString() || item.contractId?.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

export { TrackingScreen };
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Search, Filter, Plus, X, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@app/store/authStore';
import { JobCard } from '@app/components/JobCard';
import { Button } from '@app/components/Button';
import { Routes } from '../../../navigator';
import { useThemedStyle } from '@app/styles';
import { getStyles } from './jobsStyle';
import { Colors } from '@app/styles';
import { useDispatch, useSelector } from 'react-redux';
import { selectTruckTypes, selectJobs } from '@app/module/common';
import { fetchTruckTypes, fetchJobs, fetchMyApplications } from '@app/module/jobs/slice';

function PickJobsScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { userRole } = useAuthStore();
  const truckTypes = useSelector(selectTruckTypes);
  const jobs = useSelector(selectJobs);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [truckTypeFilter, setTruckTypeFilter] = useState<string>('');
  const [jobStatusFilter, setJobStatusFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ready' | 'picked'>('ready'); // Default to 'ready to pick'
  const [loading, setLoading] = useState(false);

  // Function to fetch jobs from API
  const refetchJobsWithParams = (customParams: any = {}) => {
    setLoading(true);
    
    if (activeTab === 'ready') {
      // Fetch available jobs for picking
      const defaultParams = {
        status: 'assigned',
        jobType: 'short',
        minPay: 100,
        maxPay: 10000,
        location: '',
        showNearby: 0,
        lat: null,
        lng: null,
        isMine: false, // Show all jobs for picking
        limit: 10,
        page: 1,
        truckTypeIds: null
      };
      
      const params = { ...defaultParams, ...customParams };
      console.log('PickJobs: Fetching ready jobs with params:', params);
      dispatch(fetchJobs(params));
    } else if (activeTab === 'picked') {
      // Fetch my applications (picked jobs)
      console.log('PickJobs: Fetching my applications');
      dispatch(fetchMyApplications());
    }
  };

  useEffect(() => {
    // Fetch jobs on component mount
    refetchJobsWithParams();
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      refetchJobsWithParams();
    }, [dispatch])
  );

  useEffect(() => {
    if (!truckTypes || truckTypes.length === 0) {
      dispatch(fetchTruckTypes());
    }
  }, [dispatch, truckTypes]);

  // Refetch jobs when job status filter changes
  useEffect(() => {
    refetchJobsWithParams();
  }, [jobStatusFilter]);

  // Refetch jobs when active tab changes
  useEffect(() => {
    refetchJobsWithParams();
  }, [activeTab]);

  // Update loading state when jobs change
  useEffect(() => {
    console.log('PickJobs: Jobs received:', jobs?.length || 0);
    setLoading(false);
  }, [jobs]);

  // Update filtered jobs when jobs or filters change
  useEffect(() => {
    let filtered = jobs || [];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        job =>
          job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    
    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter(job => 
        job.pickupLocation?.city === locationFilter || 
        job.dropoffLocation?.city === locationFilter
      );
    }
    
    // Apply truck type filter
    if (truckTypeFilter) {
      filtered = filtered.filter(job => 
        job.cargo?.requiredTruckTypeIds?.some((typeId: number) => 
          truckTypes.find(t => t.name === truckTypeFilter)?.id === typeId
        )
      );
    }
    
    setFilteredJobs(filtered);
  }, [jobs, searchQuery, locationFilter, truckTypeFilter, truckTypes]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const applyLocationFilter = (location: string) => {
    setLocationFilter(location);
  };

  const applyTruckTypeFilter = (truckType: string) => {
    setTruckTypeFilter(truckType);
  };

  const applyJobStatusFilter = (status: string) => {
    setJobStatusFilter(status);
  };

  const handleTabChange = (tab: 'ready' | 'picked') => {
    setActiveTab(tab);
  };

  const resetFilters = () => {
    setLocationFilter('');
    setTruckTypeFilter('');
    setJobStatusFilter('');
    setSearchQuery('');
  };

  const renderHeader = () => (
    <View style={{...styles.applyJobsHeade}}>
      <View style={styles.searchContainer}>
        <Search
          size={20}
          color={Colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t('jobs.searchPlaceholder')}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={Colors.textSecondary}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <X size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.filterButton, showFilters && styles.filterButtonActive]}
        onPress={toggleFilters}
      >
        <Filter size={20} color={showFilters ? Colors.white : Colors.primary} />
      </TouchableOpacity>

      {userRole === 'merchant' && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate(Routes.CreateJobScreen)}
        >
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'ready' && styles.activeTab,
        ]}
        onPress={() => handleTabChange('ready')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'ready' && styles.activeTabText,
          ]}
        >
          Ready to Pick
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'picked' && styles.activeTab,
        ]}
        onPress={() => handleTabChange('picked')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'picked' && styles.activeTabText,
          ]}
        >
          Picked Job
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () =>
    showFilters ? (
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>{t('jobs.filters.title')}</Text>
        <ScrollView 
          style={styles.filtersScrollView}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>{t('jobs.filters.location')}</Text>
          <View style={styles.filterOptions}>
            {Object.entries(t('jobs.locations', { returnObjects: true })).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  locationFilter === value && styles.filterChipActive,
                ]}
                onPress={() => applyLocationFilter(value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    locationFilter === value && styles.filterChipTextActive,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Job Status</Text>
          <View style={styles.filterOptions}>
            {['draft', 'active', 'assigned', 'in_progress', 'completed', 'cancelled', 'partially_completed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  jobStatusFilter === status && styles.filterChipActive,
                ]}
                onPress={() => applyJobStatusFilter(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    jobStatusFilter === status && styles.filterChipTextActive,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>{t('jobs.filters.truckType')}</Text>
          <View style={styles.filterOptions}>
            {truckTypes && truckTypes.length > 0 ? (
              truckTypes.map((truckType: any) => (
                <TouchableOpacity
                  key={truckType.id}
                  style={[
                    styles.filterChip,
                    truckTypeFilter === truckType.name && styles.filterChipActive,
                  ]}
                  onPress={() => applyTruckTypeFilter(truckType.name)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      truckTypeFilter === truckType.name && styles.filterChipTextActive,
                    ]}
                  >
                    {truckType.name || truckType.label || `Truck Type ${truckType.id}`}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.loadingText}>Loading truck types...</Text>
            )}
          </View>
        </View>
        </ScrollView>

        <Button
          title={t('jobs.filters.resetFilters')}
          variant="outline"
          onPress={resetFilters}
          style={styles.resetButton}
        />
      </View>
    ) : null;

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Loading jobs...</Text>
          <Text style={styles.emptyDescription}>Please wait while we fetch available jobs</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>{t('jobs.noJobsFound')}</Text>
        <Text style={styles.emptyDescription}>
          {userRole === 'driver'
            ? t('jobs.noJobsDriver')
            : t('jobs.noJobsMerchant')}
        </Text>

        {userRole === 'merchant' && (
          <Button
            title={t('home.postNewJob')}
            variant="primary"
            onPress={() => navigation.navigate(Routes.CreateJobScreen)}
            style={styles.emptyButton}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
              <View style={styles.headerBack}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('home.available')}</Text>
          <Text style={styles.filterLabel}>{t('home.availableTitle')}</Text>

        </View>
        <TouchableOpacity style={{}}></TouchableOpacity>
      </View>
      {renderHeader()}
      {renderTabs()}
      {renderFilters()}
      <FlatList
        data={filteredJobs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <JobCard job={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

export { PickJobsScreen };
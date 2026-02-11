/**
 * ReshareJob Screen
 * @format
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { selectTruckTypes, selectProfile } from "@app/module/common";
import { fetchTruckTypes } from "@app/module/jobs/slice";
import { httpRequest, endPoints } from "@app/service";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  DollarSign,
  Share,
} from "lucide-react-native";
import { showMessage } from "react-native-flash-message";

// Screens
import { Colors, useThemedStyle } from "@app/styles";
import { Input } from "@app/components/Input";
import { MultiSelect } from "@app/components/MultiSelect";
import { AddressDropdown } from "@app/components/AddressDropdown";
import { getStyles } from './reshareJobStyles';
import Header from "@app/components/Header";
import { Button } from "@app/components/Button";

type RootStackParamList = {
  ReshareJobScreen: { 
    job: any;
  };
};

type ReshareJobRouteProp = RouteProp<RootStackParamList, 'ReshareJobScreen'>;

function ReshareJobScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const route = useRoute<ReshareJobRouteProp>();
  const dispatch = useDispatch();
  const truckTypes = useSelector(selectTruckTypes);
  const userProfile = useSelector(selectProfile);

  const { job } = route.params || {};
  
  console.log('ReshareJobScreen - route params:', route.params);
  console.log('ReshareJobScreen - job data:', job);
  console.log('ReshareJobScreen - job title:', job?.title);
  console.log('ReshareJobScreen - job payAmount:', job?.payAmount);
  console.log('ReshareJobScreen - job pickupLocation:', job?.pickupLocation);

  // Fetch truck types when component mounts
  useEffect(() => {
    if (!truckTypes || truckTypes.length === 0) {
      dispatch(fetchTruckTypes());
    }
  }, [dispatch, truckTypes]);

  // Role posting permissions state
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Form state - only compensation and role selection are editable
  const [compensation, setCompensation] = useState("");

  // Set role ID from user profile when available
  useEffect(() => {
    console.log('User profile in reshare job:', userProfile);
    if (userProfile?.roles && userProfile.roles.length > 0) {
      const roleId = userProfile.roles[0].id;
      console.log('Setting selected role ID:', roleId);
      setSelectedRoleId(roleId);
    } else {
      console.log('No roles found in user profile');
    }
  }, [userProfile]);

  // Fetch role posting permissions when component mounts or role ID changes
  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePostingPermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  // Function to fetch role posting permissions
  const fetchRolePostingPermissions = async (roleId: number) => {
    try {
      setLoadingRolePermissions(true);
      console.log('Fetching role posting permissions for role ID:', roleId);
      console.log('API endpoint:', endPoints.roleTypes(roleId));
      
      const response = await httpRequest.get(endPoints.roleTypes(roleId));
      console.log('Role posting permissions response for role ID', roleId, ':', response);
      
      if (response?.data && Array.isArray(response.data)) {
        console.log('Role permissions data:', response.data);
        console.log('Number of permissions:', response.data.length);
        if (response.data.length > 0) {
          console.log('First permission sample:', response.data[0]);
        }
        setRolePermissions(response.data);
      } else {
        console.error('Failed to fetch role posting permissions - invalid response:', response);
        setRolePermissions([]);
      }
    } catch (error) {
      console.error('Error fetching role posting permissions:', error);
      console.error('Error details:', error?.response?.data);
      setRolePermissions([]);
    } finally {
      setLoadingRolePermissions(false);
    }
  };

  // Update form data when job data is received
  useEffect(() => {
    if (job) {
      console.log('ReshareJobScreen - Updating form data with job:', job);
      setCompensation(job?.payAmount);
    }
  }, [job]);

  // Get values from job data for display (read-only)
  const title = job?.title || "";
  const description = job?.description || "";
  const pickupAddress = job?.pickupLocation?.address || "";
  const pickupCity = job?.pickupLocation?.city || "";
  const pickupState = job?.pickupLocation?.state || "";
  const pickupZipCode = job?.pickupLocation?.zipCode || "";
  const pickupDate = job?.pickupLocation?.date ? new Date(job.pickupLocation.date) : new Date();
  const pickupTimeWindow = job?.pickupLocation?.time || "09:00";
  const deliveryAddress = job?.dropoffLocation?.address || "";
  const deliveryCity = job?.dropoffLocation?.city || "";
  const deliveryState = job?.dropoffLocation?.state || "";
  const deliveryZipCode = job?.dropoffLocation?.zipCode || "";
  const deliveryDate = job?.dropoffLocation?.date ? new Date(job.dropoffLocation.date) : new Date();
  const deliveryTimeWindow = job?.dropoffLocation?.time || "17:00";
  const distance = job?.cargo?.distance?.toString() || "";
  const estimatedDuration = job?.estimatedDuration || "";
  const cargoType = job?.cargo?.cargoType || "";
  const cargoWeight = job?.cargo?.cargoWeight?.toString() || "";
  const requiredTruckType = job?.requiredTruckType ? [job.requiredTruckType] : [];
  const specialRequirements = job?.specialRequirements || "";

  const [loading, setLoading] = useState(false);

  // Address handlers (disabled for reshare)
  const handlePickupAddressSelect = () => {
    // Disabled - no action needed for reshare
  };

  const handleDeliveryAddressSelect = () => {
    // Disabled - no action needed for reshare
  };

  // Truck type options for the multiselect
  const truckTypeOptions = truckTypes?.map((truckType: any) => ({
    id: truckType.id,
    label: truckType.name || truckType.label || `Truck Type ${truckType.id}`,
    value: truckType.id.toString(),
  })) || [];

  // Role permission options for the multiselect - using viewerRole data (same as create screen)
  const rolePermissionOptions = rolePermissions?.map((permission: any) => {
    console.log('Processing permission:', permission);
    const viewerRole = permission.viewerRole;
    const roleName = viewerRole?.name || permission.name || `Role ${permission.id}`;
    const roleDescription = viewerRole?.description || '';
    const isCompanyRole = viewerRole?.isCompanyRole || false;
    
    const option = {
      id: viewerRole?.id || permission.id,
      label: roleName + (roleDescription ? ` - ${roleDescription}` : '') + (isCompanyRole ? ' (Company Role)' : ''),
      value: (viewerRole?.id || permission.id).toString(),
      description: roleDescription,
      isCompanyRole: isCompanyRole,
    };
    console.log('Created option:', option);
    return option;
  }) || [];

  // Debug: Log the processed role options
  useEffect(() => {
    console.log('Role permissions state:', rolePermissions);
    console.log('Role permission options:', rolePermissionOptions);
    console.log('Selected role permissions:', selectedRolePermissions);
    console.log('Loading role permissions:', loadingRolePermissions);
  }, [rolePermissions, rolePermissionOptions, selectedRolePermissions, loadingRolePermissions]);

  const validateForm = () => {
    // Check if compensation is provided and not empty
    const compensationValue = compensation?.trim();
    if (!compensationValue || compensationValue === '') {
      showMessage({
        message: t("errors.missingInfo"),
        description: t("common.enterCompensationAmount"),
        type: "warning",
        duration: 4000,
      });
      return false;
    }

    // Check if compensation is a valid number
    const compensationNum = parseFloat(compensationValue);
    if (isNaN(compensationNum)) {
      showMessage({
        message: t("common.invalidAmount") || "Invalid Amount",
        description: t("common.compensationMustBeValid"),
        type: "warning",
        duration: 4000,
      });
      return false;
    }

    // Check if compensation is greater than 0
    if (compensationNum <= 0) {
      showMessage({
        message: t("common.invalidAmount") || "Invalid Amount",
        description: t("common.compensationMustBeGreater"),
        type: "warning",
        duration: 4000,
      });
      return false;
    }

    // Check if role permissions are selected
    if (!selectedRolePermissions || selectedRolePermissions.length === 0) {
      showMessage({
        message: "Missing Information",
        description: "Please select at least one target role",
        type: "warning",
        duration: 4000,
      });
      return false;
    }

    return true;
  };

  const handleReshareJob = async () => {
    console.log("handleReshareJob called");
    
    if (!validateForm()) {
      return;
    }

    console.log("Starting job reshare...");
    setLoading(true);

    try {
      // Format data for reshare API - only send required fields
      const reshareData = {
        payAmount: parseFloat(compensation),
        visibleToRoles: selectedRolePermissions.map(roleId => parseInt(roleId)),
      };

      console.log("Reshare data:", reshareData);
      console.log("Job ID:", job.id);
      console.log("API endpoint:", endPoints.reshareJob(job.id));

      // Call the actual reshare API
      const response = await httpRequest.post(
        endPoints.reshareJob(job.id),
        reshareData
      );

      console.log("Reshare API response:", response);

      if (response?.data) {
        showMessage({
          message: "Job Reshared Successfully",
          description: "Your job has been reshared to the selected roles. You should see more applications soon!",
          type: "success",
          duration: 4000,
        });
        
        // Navigate back after a short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        throw new Error("Invalid response from server");
      }

    } catch (error) {
      console.error("Error resharing job:", error);
      console.error("Error details:", error?.response?.data);
      
      let errorMessage = "Failed to reshare job. Please try again.";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showMessage({
        message: "Reshare Failed",
        description: errorMessage,
        type: "danger",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading if job data is not available
  if (!job) {
    return (
      <View style={styles.container}>
        <Header title="Reshare Job" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading job data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Reshare Job" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.reshareInfo}>
          <View style={styles.reshareIcon}>
            <Share size={20} color={Colors.white} />
          </View>
          <Text style={styles.reshareDescription}>
            Update the compensation and target roles to reach more drivers and carriers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('jobs.jobDetails')}</Text>

          <Input
            label={t('jobs.jobTitle')}
            placeholder={t('jobs.jobTitlePlaceholder')}
            value={title}
            onChangeText={() => {}} // Disabled
            editable={false}
          />

          <View style={styles.textAreaContainer}>
            <Text style={styles.label}>{t('jobs.description')}</Text>
            <TextInput
              style={[styles.textArea, styles.disabledInput]}
              placeholder={t('jobs.descriptionPlaceholder')}
              value={description}
              onChangeText={() => {}} // Disabled
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={Colors.gray400}
              editable={false}
            />
          </View>

          <Input
            label={t('jobs.compensation')}
            placeholder={t('jobs.amountPlaceholder')}
            value={compensation}
            onChangeText={setCompensation}
            keyboardType="numeric"
            // editable={false}

            leftIcon={<DollarSign size={20} color={Colors.gray400} />}
            // style={styles.editableInput}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('jobs.pickupInfo')}</Text>

          <AddressDropdown
            label={t('jobs.streetAddress')}
            placeholder={t('jobs.pickupAddressPlaceholder')}
            value={pickupAddress}
            onAddressSelect={handlePickupAddressSelect}
            disabled={true}
          />

          <View style={styles.rowInputs}>
            <View style={styles.rowInput}>
              <Input
                label={t('jobs.city')}
                placeholder="City"
                value={pickupCity}
                onChangeText={() => {}} // Disabled
                editable={false}
                // style={styles.disabledInput}
              />
            </View>
            <View style={styles.rowInput}>
              <Input
                label={t('jobs.state')}
                placeholder="State"
                value={pickupState}
                onChangeText={() => {}} // Disabled
                editable={false}
                // style={styles.disabledInput}
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={styles.rowInput}>
              <Input
                label={t('jobs.zipCode')}
                placeholder="Zip Code"
                value={pickupZipCode}
                onChangeText={() => {}} // Disabled
                editable={false}
              />
            </View>
            <View style={styles.dateInput}>
            <Input
              label={t('jobs.date')}
              placeholder="MM/DD/YYYY"
              value={pickupDate.toLocaleDateString()}
              onChangeText={() => {}}
              leftIcon={<Calendar size={20} color={Colors.gray400} />}
              // style={styles.disabledInput}
              editable={false}

              // onPress={() => setShowPickupDatePicker(true)}
            />
              {/* <TouchableOpacity
                style={[styles.dateButton, styles.disabledInput]}
                onPress={() => {}} // Disabled
                disabled={true}
              >
                <Calendar size={20} color={Colors.gray400} />
                <Text style={[styles.dateButtonText, styles.disabledText]}>
                  {pickupDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity> */}
            </View>
          </View>

          <Input
            label={t('jobs.timeWindow')}
            placeholder={t('jobs.timeWindowPlaceholder')}
            value={pickupTimeWindow}
            onChangeText={() => {}} // Disabled
            editable={false}
            // style={styles.disabledInput}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('jobs.deliveryInfo')}</Text>

          <AddressDropdown
            label={t('jobs.streetAddress')}
            placeholder={t('jobs.deliveryAddressPlaceholder')}
            value={deliveryAddress}
            onAddressSelect={handleDeliveryAddressSelect}
            disabled={true}
          />

          <View style={styles.rowInputs}>
            <View style={styles.rowInput}>
              <Input
                label={t('jobs.city')}
                placeholder="City"
                value={deliveryCity}
                onChangeText={() => {}} // Disabled
                editable={false}
                // style={styles.disabledInput}
              />
            </View>
            <View style={styles.rowInput}>
              <Input
                label={t('jobs.state')}
                placeholder="State"
                value={deliveryState}
                onChangeText={() => {}} // Disabled
                editable={false}
                // style={styles.disabledInput}
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={styles.rowInput}>
              <Input
                label={t('jobs.zipCode')}
                placeholder="Zip Code"
                value={deliveryZipCode}
                onChangeText={() => {}} // Disabled
                editable={false}
                // style={styles.disabledInput}
              />
            </View>
            <View style={styles.dateInput}>
            <Input
              label={t('jobs.date')}
              placeholder="MM/DD/YYYY"
              value={deliveryDate.toLocaleDateString()}
              onChangeText={() => {}}
              leftIcon={<Calendar size={20} color={Colors.gray400} />}
              // style={styles.disabledInput}
              editable={false}

              // onPress={() => setShowPickupDatePicker(true)}
            />
          
            </View>
          </View>

          <Input
            label={t('jobs.timeWindow')}
            placeholder={t('jobs.timeWindowPlaceholder')}
            value={deliveryTimeWindow}
            onChangeText={() => {}} // Disabled
            editable={false}
            // style={styles.disabledInput}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('jobs.cargoInfo')}</Text>

          <View style={styles.rowInputs}>
            <View style={styles.rowInput}>
              <Input
                label={t('jobs.distance')}
                placeholder={t('jobs.distancePlaceholder')}
                value={distance}
                onChangeText={() => {}} // Disabled
                editable={false}
                // style={styles.disabledInput}
              />
            </View>
            <View style={styles.rowInput}>
              <Input
                label={t('jobs.estimatedDuration')}
                placeholder={t('jobs.durationPlaceholder')}
                value={estimatedDuration}
                onChangeText={() => {}} // Disabled
                editable={false}
                // style={styles.disabledInput}
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={styles.rowInput}>
              <Input
                label={t('jobs.cargoType')}
                placeholder={t('jobs.cargoTypePlaceholder')}
                value={cargoType}
                onChangeText={() => {}} // Disabled
                editable={false}
                // style={styles.disabledInput}
              />
            </View>
            <View style={styles.rowInput}>
              <Input
                label={t('jobs.cargoWeight')}
                placeholder={t('jobs.weightPlaceholder')}
                value={cargoWeight}
                onChangeText={() => {}} // Disabled
                editable={false}
                // style={styles.disabledInput}
              />
            </View>
          </View>

          <MultiSelect
            label={t('jobs.requiredTruckType')}
            placeholder={t('jobs.truckTypePlaceholder')}
            options={truckTypeOptions}
            selectedValues={requiredTruckType}
            onSelectionChange={() => {}} // Disabled
            disabled={true}
            
          />
           <MultiSelect
             label="Visible to Roles"
             placeholder={loadingRolePermissions ? "Loading..." : "Select target roles..."}
             options={rolePermissionOptions}
             selectedValues={selectedRolePermissions}
             onSelectionChange={setSelectedRolePermissions}
             disabled={loadingRolePermissions}
           />

          <View style={styles.textAreaContainer}>
            <Text style={styles.label}>{t('jobs.specialRequirements')}</Text>
            <TextInput
              style={[styles.textArea, styles.disabledInput]}
              placeholder={t('jobs.specialRequirementsPlaceholder')}
              value={specialRequirements}
              onChangeText={() => {}} // Disabled
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor={Colors.gray400}
              editable={false}
            />
          </View>
        </View>

        <View style={styles.section}>
  

        
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Reshare Job"
          variant="primary"
          fullWidth
          loading={loading}
          onPress={handleReshareJob}
          leftIcon={<Share size={20} color={Colors.white} />}
        />
      </View>

    </View>
  );
}

export { ReshareJobScreen };

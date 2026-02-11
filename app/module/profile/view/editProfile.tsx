/**
 * EditProfile Screen
 * @format
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import {
  User,
  Camera,
  MapPin,
  Building2,
  ChevronDown,
  Search,
  X,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

// Screens
import { Colors, useThemedStyle } from "@app/styles";
import { Button } from "@app/components/Button";
import { Input } from "@app/components/Input";
import { AddressDropdown } from "@app/components/AddressDropdown";
import { DriverProfile, MerchantProfile } from "@app/types";
import { ParsedAddress } from "@app/utils";
import { getStyles } from "./editStyles";
import { selectCompany, selectProfile, selectTruckTypes, selectLoader } from "@app/module/common";
import { useDispatch, useSelector } from "react-redux";
import { editProfile, fetchProfile } from "../slice";
import { uploadFileToServer, createFileDataFromAsset } from "@app/utils";
import Header from "@app/components/Header";
import { fetchTruckTypes } from "@app/module/jobs/slice";
import DropDownPicker from "react-native-dropdown-picker";
import DatePicker from "react-native-date-picker";
import { COUNTRIES, findCountryByCallingCode, filterCountries } from "@app/constants/countries";
import { useFocusEffect } from "@react-navigation/native";

function EditProfileScreen({ navigation }: any) {
  const styles = useThemedStyle(getStyles);


  const { t } = useTranslation();
  const businessTypes = Object.entries(
    t('businessTypes', { returnObjects: true })
  ).map(([key, value]) => ({
    label: value,
    value: key,
  }));
  console.log(businessTypes, "businessTypesbusinessTypesbusinessTypes");

  // Helper function to map industryType from API to dropdown value
  const mapIndustryTypeToDropdownValue = (apiValue: string | undefined): string => {
    if (!apiValue) return "";
    
    // First, try to find exact match by key
    const exactMatch = businessTypes.find(item => item.value === apiValue);
    if (exactMatch) return exactMatch.value;
    
    // Then, try to find match by label (translated value)
    const labelMatch = businessTypes.find(item => item.label === apiValue);
    if (labelMatch) return labelMatch.value;
    
    // If no match found, return empty string
    console.log('No matching industryType found for:', apiValue);
    return "";
  };
  const userProfile = useSelector(selectProfile);
  const userRole = userProfile?.roles?.[0]?.role?.name;
  const truckTypes = useSelector(selectTruckTypes);

  const companyProfile = useSelector(selectCompany);
  const dispatch = useDispatch();
  console.log(userProfile, "userProfileuserProfileuserProfile");

  // Format date for display (YYYY-MM-DD format)
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if invalid
      }
      
      // Format as "YYYY-MM-DD" (e.g., "2026-12-31")
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original string on error
    }
  };

  // Fetch truck types when component mounts
  useEffect(() => {
    if (!truckTypes || truckTypes?.length === 0) {
      dispatch(fetchTruckTypes());
    }
  }, [dispatch, truckTypes]);

  // Refresh profile data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Edit profile screen focused, refreshing profile data');
      dispatch(fetchProfile());
    });

    return unsubscribe;
  }, [navigation, dispatch]);

  // Debug log to track profile data changes
  useEffect(() => {
    console.log('Profile data in edit profile screen:', userProfile);
    console.log('User role:', userRole);
  }, [userProfile, userRole]);

  // Refresh form fields when profile data changes
  useEffect(() => {
    if (userProfile) {
      console.log('Profile data changed, refreshing form fields');
      
      // Basic profile fields
      setName(userProfile.userName || "");
      setPhone(userProfile.phoneNumber || "");
      const phoneCountryCode = userProfile.phoneCountryCode || "+1";
      setCountryCode(phoneCountryCode);
      
      // Initialize country based on phone country code
      const initialCountry = getInitialCountry(phoneCountryCode);
      setSelectedCountry(initialCountry);
      
      setAvatar(userProfile.profileImage);
      
      // Company fields
      if (companyProfile) {
        setCompany(companyProfile?.companyName || "");
        setAddress(companyProfile?.address || "");
        setState(companyProfile?.state || "");
        setCity(companyProfile?.city || "");
        setPincode(companyProfile?.zipCode || "");
        setCountry(companyProfile?.country || "");
        const mappedIndustryType = mapIndustryTypeToDropdownValue(companyProfile?.industryType);
        console.log('Setting industryType (useEffect):', {
          apiValue: companyProfile?.industryType,
          mappedValue: mappedIndustryType,
          businessTypes: businessTypes.map(bt => ({ value: bt.value, label: bt.label }))
        });
        setIndustryType(mappedIndustryType);
      }
      
      // Driver-specific fields
      if (userRole === "driver") {
        const driverProfile = userProfile as DriverProfile;
        
        // Debug log to see the profile structure
        console.log('Driver profile data (useEffect):', driverProfile);
        console.log('License number from profile (useEffect):', driverProfile.licenseNumber);
        console.log('License expiry from profile (useEffect):', driverProfile.licenseExpiry);

        // Truck type
        if (driverProfile.truckType) {
          const truckTypeId = Array.isArray(driverProfile.truckType)
            ? String(driverProfile.truckType[0])
            : String(driverProfile.truckType);
          setSelectedTruckType(truckTypeId);
        }

        // Driver profile fields
        setLicenseNumber(driverProfile.licenseNumber || "");
        setLicenseExpiry(driverProfile.licenseExpiry || "");
        
        // Driver-specific fields from profile
        setTruckLabel((driverProfile as any)?.truckLabel || "");
        setTruckCapacity(driverProfile.truckCapacity || "");
        setCapacityUnit((driverProfile as any)?.capacityUnit || "");
        setWorkRadius((driverProfile as any)?.workRadius?.toString() || "100");
        
        // Handle nested driver data from API response
        if ((userProfile as any)?.driver) {
          const driverData = (userProfile as any).driver;
          console.log('Nested driver data (useEffect):', driverData);
          console.log('License number from nested driver (useEffect):', driverData.licenseNumber);
          console.log('License expiry from nested driver (useEffect):', driverData.drivingLicenseExpiresAt);
          
          setLicenseNumber(driverData.licenseNumber || "");
          const formattedDate = driverData.drivingLicenseExpiresAt
            ? formatDate(driverData.drivingLicenseExpiresAt)
            : "";
          setLicenseExpiry(formattedDate);
          setWorkRadius(driverData.workRadius?.toString() || "100");
        }
        
        // Handle nested truck data from API response
        if ((userProfile as any)?.trucks && (userProfile as any)?.trucks?.length > 0) {
          const truckData = (userProfile as any).trucks[0];
          setSelectedTruckType(truckData.truckTypeId?.toString() || "");
          setTruckCapacity(truckData.capacity || "");
          setCapacityUnit(truckData.capacityUnit || "");
          setTruckLabel(truckData.label || "");
        }
      }
    }
  }, [userProfile, companyProfile, userRole]);

  // Initialize country based on phone country code
  const getInitialCountry = (phoneCountryCode: string) => {
    return findCountryByCallingCode(phoneCountryCode) || COUNTRIES[0]; // Default to US if not found
  };

  // Initialize and update form fields from user profile
  useFocusEffect(
    useCallback(() => {
      if (userProfile) {
        // Basic profile fields
        setName(userProfile.userName || "");
        setPhone(userProfile.phoneNumber || "");
        const phoneCountryCode = userProfile.phoneCountryCode || "+1";
        setCountryCode(phoneCountryCode);
  
        // Initialize country based on phone country code
        const initialCountry = getInitialCountry(phoneCountryCode);
        setSelectedCountry(initialCountry);
  
        setAvatar(userProfile.profileImage);
  
        // Company fields
        if (companyProfile) {
          setCompany(companyProfile?.companyName || "");
          setAddress(companyProfile?.address || "");
          setState(companyProfile?.state || "");
          setCity(companyProfile?.city || "");
          setPincode(companyProfile?.zipCode || "");
          setCountry(companyProfile?.country || "");
          const mappedIndustryType = mapIndustryTypeToDropdownValue(companyProfile?.industryType);
          console.log('Setting industryType (useFocusEffect):', companyProfile?.industryType, '->', mappedIndustryType);
          setIndustryType(mappedIndustryType);
        }
  
        // Driver-specific fields
        if (userRole === "driver") {
          const driverProfile = userProfile as DriverProfile;
          
          // Debug log to see the profile structure
          console.log('Driver profile data:', driverProfile);
          console.log('License number from profile:', driverProfile.licenseNumber);
          console.log('License expiry from profile:', driverProfile.licenseExpiry);

          // Truck type
          if (driverProfile.truckType) {
            const truckTypeId = Array.isArray(driverProfile.truckType)
              ? String(driverProfile.truckType[0])
              : String(driverProfile.truckType);
            setSelectedTruckType(truckTypeId);
          }

          // Driver profile fields
          setLicenseNumber(driverProfile.licenseNumber || "");
          setLicenseExpiry(driverProfile.licenseExpiry || "");
  
          // Driver-specific fields from profile
          setTruckLabel((driverProfile as any)?.truckLabel || "");
          setTruckCapacity(driverProfile.truckCapacity || "");
          setCapacityUnit((driverProfile as any)?.capacityUnit || "");
          setWorkRadius((driverProfile as any)?.workRadius?.toString() || "100");
  
          // Handle nested driver data from API response
          if ((userProfile as any)?.driver) {
            const driverData = (userProfile as any).driver;
            console.log('Nested driver data:', driverData);
            console.log('License number from nested driver:', driverData.licenseNumber);
            console.log('License expiry from nested driver:', driverData.drivingLicenseExpiresAt);
            
            setLicenseNumber(driverData.licenseNumber || "");
            const formattedDate = driverData.drivingLicenseExpiresAt
              ? formatDate(driverData.drivingLicenseExpiresAt)
              : "";
            setLicenseExpiry(formattedDate);
            setWorkRadius(driverData.workRadius?.toString() || "100");
          }
  
          // Handle nested truck data from API response
          if ((userProfile as any)?.trucks && (userProfile as any)?.trucks?.length > 0) {
            const truckData = (userProfile as any).trucks[0];
            setSelectedTruckType(truckData.truckTypeId?.toString() || "");
            setTruckCapacity(truckData.capacity || "");
            setCapacityUnit(truckData.capacityUnit || "");
            setTruckLabel(truckData.label || "");
          }
        }
      }
    }, [])
  );

  // Truck type options for the dropdown - use real data from API
  const truckTypeItems = truckTypes?.map((truckType: any) => ({
    label: truckType.name || truckType.label || `Truck Type ${truckType.id}`,
    value: truckType.id.toString(),
  })) || [];

  // Capacity unit options
  const capacityUnitItems = [
    { label: "ft", value: "ft" },
    { label: "tons", value: "tons" },
    { label: "lbs", value: "lbs" },
    { label: "kg", value: "kg" },
    { label: "m3", value: "m3" },
  ];

  const [name, setName] = useState(userProfile?.userName || "");
  const [phone, setPhone] = useState(userProfile?.phoneNumber || "");
  const [countryCode, setCountryCode] = useState("+1");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [avatar, setAvatar] = useState(userProfile?.profileImage);
  const loading = useSelector(selectLoader);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Filter countries based on search query
  const filteredCountries = filterCountries(searchQuery);

  // Country picker functions
  const onCountrySelect = (country: any) => {
    setSelectedCountry(country);
    setCountryCode(`+${country.callingCode[0]}`);
    setCountryPickerVisible(false);
    setSearchQuery("");
  };

  // Driver-specific fields
  const [selectedTruckType, setSelectedTruckType] = useState<string>("");
  const [truckTypeOpen, setTruckTypeOpen] = useState(false);
  const [truckLabel, setTruckLabel] = useState(
    userRole === "driver"
      ? (userProfile as any)?.truckLabel || ""
      : ""
  );
  const [truckCapacity, setTruckCapacity] = useState(
    userRole === "driver"
      ? (userProfile as DriverProfile)?.truckCapacity || ""
      : ""
  );
  const [capacityUnit, setCapacityUnit] = useState(
    userRole === "driver"
      ? (userProfile as any)?.capacityUnit || ""
      : ""
  );
  const [capacityUnitOpen, setCapacityUnitOpen] = useState(false);
  const [workRadius, setWorkRadius] = useState(
    userRole === "driver"
      ? (userProfile as any)?.workRadius || "100"
      : "100"
  );
  const [licenseNumber, setLicenseNumber] = useState(
    userRole === "driver"
      ? (userProfile as DriverProfile)?.licenseNumber || ""
      : ""
  );
  const [licenseExpiry, setLicenseExpiry] = useState(
    userRole === "driver"
      ? (userProfile as DriverProfile)?.licenseExpiry ? formatDate((userProfile as DriverProfile).licenseExpiry) : ""
      : ""
  );
  const [licenseExpiryDate, setLicenseExpiryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Handle date picker
  const handleDateConfirm = (date: Date) => {
    setLicenseExpiryDate(date);
    // Format as YYYY-MM-DD for API compatibility
    const formattedDate = formatDateForAPI(date);
    setLicenseExpiry(formattedDate);
    setShowDatePicker(false);
  };

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Parse date string safely
  const parseDate = (dateString: string) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  // Initialize date picker with license expiry date
  useEffect(() => {
    if (licenseExpiry) {
      const date = parseDate(licenseExpiry);
      if (date) {
        setLicenseExpiryDate(date);
      }
    }
  }, [licenseExpiry]);

  // Merchant-specific fields
  const [company, setCompany] = useState(
    userRole === "merchant"
      ? (userProfile as any)?.companyName || ""
      : companyProfile?.companyName || ""
  );
  const [address, setAddress] = useState(
    companyProfile?.address
  );
  const [state, setState] = useState(companyProfile?.state || "");
  const [city, setCity] = useState(companyProfile?.city || "");
  const [pincode, setPincode] = useState(companyProfile?.zipCode || "");
  const [country, setCountry] = useState(companyProfile?.country || "");
  const [industryType, setIndustryType] = useState(() => {
    const initialValue = companyProfile?.industryType || "";
    return mapIndustryTypeToDropdownValue(initialValue);
  });
  const [industryTypeOpen, setIndustryTypeOpen] = useState(false);
  
  // Address autocomplete state
  const [addressInput, setAddressInput] = useState(address);

  // Handle address selection from autocomplete
  const handleAddressSelect = (parsedAddress: ParsedAddress) => {
    setAddress(parsedAddress.address);
    setCity(parsedAddress.city);
    setState(parsedAddress.state);
    setPincode(parsedAddress.pincode);
    setCountry(parsedAddress.country);
    setAddressInput(parsedAddress.address);
  };

  const pickImage = async () => {
    try {
      launchImageLibrary(
        {
          mediaType: "photo",
          includeBase64: false,
          maxHeight: 512,
          maxWidth: 512,
          quality: 0.5,
        },
        async (response) => {
          if (response.didCancel || !response.assets || !response.assets?.length)
            return;

          const asset = response.assets[0];
          console.log("📁 Image selected:", asset.uri);

          // Set uploading state
          setUploadingImage(true);

          // Create file data for upload
          const fileData = createFileDataFromAsset(
            asset,
            `profile_${Date.now()}.jpg`
          );

          console.log("📁 File data created:", fileData);

          // Upload the image
          console.log("🚀 Dispatching upload action...");
          uploadFileToServer(
            fileData,
            dispatch,
            (uploadResponse) => {
              console.log(
                "✅ Upload success callback triggered:",
                uploadResponse
              );
              // On successful upload, update the avatar with the uploaded URL
              if (uploadResponse?.url) {
                setAvatar(uploadResponse.url);
                console.log("Image uploaded successfully:", uploadResponse.url);
              } else {
                console.log(
                  "Upload successful but no URL in response:",
                  uploadResponse
                );
                // Fallback to local URI if no URL in response
                setAvatar(asset.uri);
              }
              setUploadingImage(false);
            },
            (error) => {
              console.log("❌ Upload error callback triggered:", error);
              console.error("Image upload failed:", error);
              Alert.alert(
                t("errors.general"),
                t("errors.imageUploadFailed") ||
                  "Failed to upload image. Please try again."
              );
              // Fallback to local URI on upload failure
              setAvatar(asset.uri);
              setUploadingImage(false);
            }
          );
        }
      );
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(t("errors.general"), t("errors.validation"));
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!userProfile) return;

    // Validate required fields
    if (!name || !phone) {
      Alert.alert(t("common.error"), t("common.fillAllRequiredFields"));
      return;
    }

    // Validate driver-specific fields
    if (userRole === "driver") {
      if (!licenseNumber || !licenseExpiry || !selectedTruckType || !truckCapacity || !truckLabel || !capacityUnit) {
        Alert.alert(t("common.error"), t("common.fillAllDriverFields"));
        return;
      }
    }

    try {
      // Prepare base data
      const data: any = {
        userName: name,
        phoneNumber: phone,
        phoneCountryCode: countryCode,
        profileImage:
          avatar,
      };

      // Add driver-specific fields if user is a driver
      if (userRole === "driver") {
        // Driver information
        data.driver = {
          licenseNumber: licenseNumber,
          drivingLicenseExpiresAt: licenseExpiry,
          workRadius: Number(workRadius)
        };

        // Truck information
        data.trucks = [
          {
            truckTypeId: Number(selectedTruckType),
            capacity: truckCapacity,
            capacityUnit: capacityUnit.toLowerCase(),
            isPrimary: false, // First truck is primary
            label: truckLabel
          }
        ];
      } else {
        // Get the label for the selected industryType to save to API
        const selectedBusinessType = businessTypes.find(item => item.value === industryType);
        const industryTypeToSave = selectedBusinessType ? selectedBusinessType.value : (industryType || companyProfile?.industryType || "");
        
        console.log('Saving industryType:', {
          dropdownValue: industryType,
          selectedBusinessType,
          industryTypeToSave
        });
        
        data.company = {
          companyName: company,
          industryType: industryTypeToSave,
          contactNumber: companyProfile?.contactNumber || "+124567890",
          phoneNumber: companyProfile?.phoneNumber || "+123457890",
          address: address,
          country: country,
          state: state,
          city: city,
          zipCode: pincode,
      };
      }
      
      console.log('Profile update payload:', JSON.stringify(data, null, 2));
      const response = dispatch(editProfile(data));
      console.log(response, "response edit profile ");
      if(response?.payload){
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert(t("errors.general"), t("errors.validation"));
    }
  };

  const renderDriverFields = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.info.truckInfo")}</Text>

        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>{t("profile.info.truckType")}</Text>
          <DropDownPicker
            open={truckTypeOpen}
            value={selectedTruckType}
            items={truckTypeItems}
            setOpen={setTruckTypeOpen}
            setValue={setSelectedTruckType}
          placeholder={t("forms.truckTypePlaceholder")}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainerStyle}
            textStyle={styles.dropdownText}
            placeholderStyle={styles.placeholderStyle}
          />
        </View>

        <Input
          label={t("forms.truckCapacity")}
          placeholder={t("forms.truckCapacityPlaceholder")}
          value={truckCapacity}
          onChangeText={setTruckCapacity}
        />

        <Input
          label="Truck Label"
          placeholder="Enter truck label"
          value={truckLabel}
          onChangeText={setTruckLabel}
        />

        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>Capacity Unit</Text>
          <DropDownPicker
            open={capacityUnitOpen}
            value={capacityUnit}
            items={capacityUnitItems}
            setOpen={setCapacityUnitOpen}
            setValue={setCapacityUnit}
            placeholder="Select capacity unit"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainerStyle}
            placeholderStyle={styles.placeholderStyle}
            labelStyle={styles.labelStyle}
            listItemLabelStyle={styles.dropdownText}
            zIndex={1000}
            zIndexInverse={3000}
            textStyle={styles.dropdownText}

          />
        </View>

        <Input
          label="Work Radius (miles)"
          placeholder="Enter work radius in miles"
          value={workRadius}
          onChangeText={setWorkRadius}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.documents.cdl")}</Text>

        <Input
          label={t("profile.documents.licenseNumber")}
          placeholder={t("forms.licenseNumberPlaceholder")}
          value={licenseNumber}
          onChangeText={setLicenseNumber}
        />

        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerLabel}>{t("profile.documents.cdlExpires")}</Text>
          <View style={styles.datePickerInput}>
            <Text style={[styles.datePickerText, !licenseExpiry && styles.placeholderText]}>
              {licenseExpiry ? formatDate(licenseExpiry) : t("forms.licenseExpiryPlaceholder")}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderMerchantFields = () => (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("forms.companyInformation")}</Text>

        <Input
          label={t("profile.info.company")}
          placeholder={t("forms.companyPlaceholder")}
          value={company}
          onChangeText={setCompany}
          leftIcon={<Building2 size={20} color={Colors.gray400} />}
        />
     <View style={styles.dropdownContainer}>
          <Text style={styles.label}>{t("forms.companyType")}</Text>
          <DropDownPicker
            open={industryTypeOpen}
            value={industryType}
            items={businessTypes}
            setOpen={setIndustryTypeOpen}
            setValue={setIndustryType}
            placeholder={t("forms.companyType") || "Select Industry Type"}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainerStyle}
            textStyle={styles.dropdownText}
            placeholderStyle={styles.placeholderStyle}
            zIndex={3000}
            zIndexInverse={1000}
            listMode="SCROLLVIEW"
            scrollViewProps={{
              nestedScrollEnabled: true,
            }}
          />
        </View>
        <AddressDropdown
       
          label={t("profile.info.address")}
          placeholder={t("forms.addressPlaceholder")}
          value={addressInput || companyProfile?.address}
          onAddressSelect={handleAddressSelect}
          onTextChange={setAddressInput}
        />
        
        <Text style={styles.autoFillNote}>
          💡 City, State, and Pincode will be auto-filled when you select an address
        </Text>

        <View style={styles.row}>
          <Input
            label={t("profile.info.state")}
            placeholder={t("forms.statePlaceholder")}
            value={state}
            onChangeText={setState}
            leftIcon={<MapPin size={20} color={Colors.gray400} />}
            containerStyle={styles.halfWidth}
          />

          <Input
            label={t("profile.info.city")}
            placeholder={t("forms.cityPlaceholder")}
            value={city}
            onChangeText={setCity}
            leftIcon={<MapPin size={20} color={Colors.gray400} />}
            containerStyle={styles.halfWidth}
          />
        </View>

        <View style={styles.row}>
          <Input
            label={t("profile.info.pincode")}
            placeholder={t("forms.pincodePlaceholder")}
            value={pincode}
            onChangeText={setPincode}
            leftIcon={<MapPin size={20} color={Colors.gray400} />}
            containerStyle={styles.halfWidth}
            keyboardType="numeric"
          />

          <Input
            label={t("profile.info.country")}
            placeholder={t("forms.countryPlaceholder")}
            value={country}
            onChangeText={setCountry}
            leftIcon={<MapPin size={20} color={Colors.gray400} />}
            containerStyle={styles.halfWidth}
          />
        </View>

   
      </View>
  );

  // Custom Country Picker Modal
  const renderCountryPicker = () => (
    <Modal
      visible={countryPickerVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setCountryPickerVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity 
              onPress={() => {
                setCountryPickerVisible(false);
                setSearchQuery("");
              }}
              style={styles.closeButton}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.gray400} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search countries..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.gray400}

            />
          </View>
          
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.cca2}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryItem}
                onPress={() => onCountrySelect(item)}
              >
                <Text style={styles.countryFlag}>{item.emoji}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryCode}>+{item.callingCode[0]}</Text>
              </TouchableOpacity>
            )}
            style={styles.countryList}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header title={t("profile.editProfile")} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <User size={40} color={Colors.white} />
              </View>
            )}

            <TouchableOpacity
              style={styles.changeAvatarButton}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <Text style={{ color: Colors.white, fontSize: 12 }}>...</Text>
              ) : (
                <Camera size={20} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.changePhotoText}>{t("profile.changePhoto")}</Text>
          {uploadingImage && (
            <Text
              style={[
                styles.changePhotoText,
                { color: Colors.primary, fontSize: 12 },
              ]}
            >
              Uploading image...
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("forms.basicInfo")}</Text>
          <Input
            label={t("forms.fullName")}
            placeholder={t("forms.fullNamePlaceholder")}
            value={name}
            onChangeText={setName}
            leftIcon={<User size={20} color={Colors.gray400} />}
          />

          {/* Country Selection */}
          <View style={styles.countryContainer}>
            <Text style={styles.label}>{t("forms.countryPlaceholder")}</Text>
            <TouchableOpacity
              style={styles.countryPickerButton}
              onPress={() => setCountryPickerVisible(true)}
            >
              <View style={styles.countryPickerContent}>
                <Text style={styles.countryFlag}>{selectedCountry.emoji}</Text>
                <Text style={styles.countryNameText}>
                  {selectedCountry.name} (+{selectedCountry.callingCode[0]})
                </Text>
              </View>
              <ChevronDown size={16} color={Colors.gray400} />
            </TouchableOpacity>
          </View>

          {/* Phone Number Input */}
          <Input
            label={t("forms.phone")}
            placeholder={t("forms.phonePlaceholder")}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>{countryCode}</Text>
              </View>
            }
          />
        </View>

        {userRole === "driver" ? renderDriverFields() : renderMerchantFields()}

        <Button
          title={t("buttons.save")}
          variant="primary"
          fullWidth
          loading={loading}
          onPress={handleSave}
          style={styles.saveButton}
        />
      </ScrollView>

      {/* Custom Country Picker Modal */}
      {renderCountryPicker()}

      <DatePicker
        modal
        open={showDatePicker}
        date={licenseExpiryDate}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
        minimumDate={new Date()}
      />
    </View>
  );
}

export { EditProfileScreen };
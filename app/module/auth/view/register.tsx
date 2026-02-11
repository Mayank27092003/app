/**
 * Register Screen
 * @format
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActionSheetIOS,
  Image,
  PermissionsAndroid,
  Alert,
  Modal,
  FlatList,
  TextInput,
  Linking,
  useWindowDimensions,
} from "react-native";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Phone,
  ChevronDown,
  ChevronUp,
  Building2,
  Search,
  X,
  Check,
  FileText,
} from "lucide-react-native";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
//Screens
import { Colors, useThemedStyle } from "@app/styles";
import { Input } from "@app/components/Input";
import { Button } from "@app/components/Button";
import { createLoader, uploadFile } from "../../common";
import { getStyles } from "./styles";
import { Routes } from "@app/navigator";
import DropDownPicker from "react-native-dropdown-picker";
import { useRoute } from "@react-navigation/native";
import { signUp } from "../slice";
import ImageCropPicker from "react-native-image-crop-picker";
import { showMessage } from "react-native-flash-message";
import { COUNTRIES, findCountryByCallingCode, filterCountries } from "@app/constants/countries";
import RenderHtml from 'react-native-render-html';
import { LanguageSelector } from "@app/components";

const loader = createLoader();
import { SafeText } from "@app/components/SafeText";

function RegisterScreen({ navigation }: any) {
  const { t } = useTranslation();
  const route = useRoute();
  const { width } = useWindowDimensions();

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    {
      label: t("profile.merchantTypes.shipper"),
      value: 2,
    },
    {
      label: t("profile.merchantTypes.broker"),
      value: 1,
    },
    {
      label: t("profile.merchantTypes.carrier"),
      value: 3,
    },
  ]);
  const styles = useThemedStyle(getStyles);
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Country picker state
  const [countryCode, setCountryCode] = useState("+1");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Agreement state
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementModalVisible, setAgreementModalVisible] = useState(false);

  // Filter countries based on search query
  const filteredCountries = filterCountries(searchQuery);

  // Country picker functions
  const onCountrySelect = (country: any) => {
    setSelectedCountry(country);
    setCountryCode(`+${country.callingCode[0]}`);
    setCountryPickerVisible(false);
    setSearchQuery("");
  };

  // Get user type for agreement
  const getUserType = (): string | null => {
    const isMerchant = (route?.params as any)?.type === "merchant";
    if (!isMerchant) return "driver";

    // Map dropdown value to type name
    switch (value) {
      case 1: return "broker";
      case 2: return "shipper";
      case 3: return "carrier";
      default: return null; // No role selected yet
    }
  };

  // Check if agreement should be shown (only when a valid role is selected)
  const shouldShowAgreement = () => {
    return getUserType() !== null;
  };

  // Get agreement content based on user type - uses translation keys
  const getAgreementContent = () => {
    const userType = getUserType();

    // If no role selected, return empty agreement (this shouldn't happen as modal is hidden)
    if (!userType) {
      return { title: "", content: "" };
    }

    type Agreement = {
      title: string;
      content: string;
    };

    const agreements: Record<string, Agreement> = {
      driver: {
        title: t("agreement.driver.title") || "GOFRTS DRIVER AGREEMENT",
        content: t("agreement.driver.content") || "",
      },
      broker: {
        title: t("agreement.broker.title") || "GOFRTS BROKER AGREEMENT",
        content: t("agreement.broker.content") || "",
      },
      carrier: {
        title: t("agreement.carrier.title") || "GOFRTS CARRIER AGREEMENT",
        content: t("agreement.carrier.content") || "",
      },
      shipper: {
        title: t("agreement.shipper.title") || "GOFRTS SHIPPER AGREEMENT",
        content: t("agreement.shipper.content") || "",
      },
    };

    return agreements[userType] || { title: "", content: "" };
  };

  // HTML tag styles for RenderHtml
  const tagsStyles = {
    body: {
      color: Colors.text,
      fontSize: 14,
      lineHeight: 22,
    },
    h1: {
      color: Colors.primary,
      fontSize: 18,
      fontWeight: 'bold' as const,
      marginBottom: 12,
      marginTop: 8,
    },
    h2: {
      color: Colors.primary,
      fontSize: 16,
      fontWeight: '600' as const,
      marginBottom: 8,
      marginTop: 16,
    },
    h3: {
      color: Colors.text,
      fontSize: 15,
      fontWeight: '600' as const,
      marginBottom: 6,
      marginTop: 12,
    },
    p: {
      color: Colors.text,
      fontSize: 13,
      lineHeight: 22,
      marginBottom: 12,
      textAlign: 'justify' as const,
    },
    strong: {
      fontWeight: 'bold' as const,
      color: Colors.text,
    },
    ul: {
      marginBottom: 12,
    },
    li: {
      color: Colors.text,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 4,
    },
  };

  // Render Agreement Modal
  const renderAgreementModal = () => {
    const agreement = getAgreementContent();
    const htmlSource = { html: agreement.content };
    return (
      <Modal
        visible={agreementModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAgreementModalVisible(false)}
      >
        <View style={styles.agreementModalContainer}>
          <View style={styles.agreementModalContent}>
            <View style={styles.agreementModalHeader}>
              <FileText size={24} color={Colors.primary} />
              <SafeText style={styles.agreementModalTitle}>{agreement.title}</SafeText>
              <TouchableOpacity
                onPress={() => setAgreementModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.agreementScrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <RenderHtml
                contentWidth={width - 64}
                source={htmlSource}
                tagsStyles={tagsStyles}
              />
            </ScrollView>
            <View style={styles.agreementModalFooter}>
              <TouchableOpacity
                style={styles.agreementDeclineButton}
                onPress={() => setAgreementModalVisible(false)}
              >
                <SafeText style={styles.agreementDeclineButtonText}>
                  {t("common.close") || "Close"}
                </SafeText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.agreementAcceptButton}
                onPress={() => {
                  setAgreementAccepted(true);
                  setAgreementModalVisible(false);
                }}
              >
                <Check size={18} color={Colors.white} />
                <SafeText style={styles.agreementAcceptButtonText}>
                  {t("agreement.iAgree") || "I AGREE"}
                </SafeText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const handleRegister = async () => {
    // Validate inputs
    const isMerchant = (route?.params as any)?.type === "merchant";
    if (!name || !email || !phone || !password || !confirmPassword || (isMerchant && !companyName)) {
      showMessage({
        message: t("auth.register.errors.fillFields"),
        type: "danger",
      });
      return;
    }

    if (password !== confirmPassword) {
      showMessage({
        message: t("auth.register.errors.passwordMismatch"),
        type: "danger",
      });
      return;
    }

    // Check if agreement is accepted (only required when a role is selected)
    if (shouldShowAgreement() && !agreementAccepted) {
      showMessage({
        message: t("auth.register.errors.acceptAgreement") || "Please accept the agreement to continue",
        type: "danger",
      });
      return;
    }

    // If there's a local image but no uploaded URL, wait for upload to complete
    if (localImageUri && !uploadedImageUrl && isUploading) {
      showMessage({
        message: "Please wait for image upload to complete",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    const payload = {
      userName: name,
      email: email.toLowerCase().trim(),
      password: password,
      phoneNumber: phone,
      phoneCountryCode: countryCode,
      callbackUrl: "string",
      companyTypeId: value,
      companyName: isMerchant ? companyName : name,
      profileImage: uploadedImageUrl || localImageUri
    };
    console.log(payload, 'payloadddddddd')
    try {
      const response = await dispatch(signUp(payload));
      console.log("Signup dispatch completed:", response);

      // Navigation is now handled in the saga
      // No need to check response here as saga handles success/error

    } catch (err) {
      // Handle any unexpected errors
      const errorMessage = err?.message || t("auth.register.errors.registerError");
      showMessage({
        message: errorMessage,
        type: "danger",
      });
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };
  const requestCameraPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t("common.cameraPermissionRequired") || "Camera Permission",
            message: t("common.appNeedsCameraAccess") || "App needs access to your camera",
            buttonNeutral: t("common.askMeLater") || "Ask Me Later",
            buttonNegative: t("common.cancel"),
            buttonPositive: t("common.ok"),
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            t("common.permissionRequired") || "Permission Required",
            t("common.cameraPermissionRequiredMessage") || "Camera permission is required. Please enable it in app settings.",
            [
              { text: t("common.cancel") },
              { text: t("common.openSettings") || "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
        }
        return false;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === "android") {
      try {
        const permission =
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted = await PermissionsAndroid.request(permission, {
          title: "Storage Permission",
          message: "App needs access to your files",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        });

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            t("common.permissionRequired") || "Permission Required",
            t("common.storagePermissionRequired") || "Storage permission is required. Please enable it in app settings.",
            [
              { text: t("common.cancel") },
              { text: t("common.openSettings") || "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
        }
        return false;
      } catch (err) {
        console.warn("Permission error:", err);
        return false;
      }
    }
    return true;
  };
  const handleImagePicker = async (
    source: "camera" | "library",
    uploadType: "COVER" | "PROFILE"
  ) => {
    try {
      setMediaLoading(true);
      let result;

      const options = {
        cropping: true,
        cropperToolbarTitle: `Crop ${uploadType === "COVER" ? "Cover" : "Profile"
          } Image`,
        width: uploadType === "COVER" ? 1600 : 800,
        height: uploadType === "COVER" ? 900 : 800,
        compressImageQuality: 0.8,
        multiple: false,
      };
      if (source === "camera") {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        result = await ImageCropPicker.openCamera(options);

      } else {
        // ❌ DO NOT request storage permission (Google rejects it)
        // ✅ Safe to directly open picker
        result = await ImageCropPicker.openPicker(options);
      }
      // if (source === "camera") {
      //   const hasPermission = await requestCameraPermission();
      //   if (!hasPermission) return;
      //   result = await ImageCropPicker.openCamera(options);
      // } else {
      //   const hasPermission = await requestStoragePermission();
      //   if (!hasPermission) return;
      //   result = await ImageCropPicker.openPicker(options);
      // }

      if (!result?.path) return;

      setLocalImageUri(result.path);

      // Create file data for upload
      const fileData = {
        uri: result.path,
        type: result.mime || "image/jpeg",
        name: `${uploadType.toLowerCase()}_${Date.now()}.jpg`,
      };

      setIsUploading(true);

      // Upload the file using the correct upload function
      const response = dispatch(uploadFile(
        fileData,
        (response) => {
          // Success callback
          showMessage({
            message: `${uploadType === "COVER" ? "Cover" : "Profile"
              } image uploaded successfully!`,
            type: "success",
          });

          // Store the uploaded image URL from server response
          console.log("Upload response:", response);
          if (response?.data?.url) {
            setUploadedImageUrl(response.data.url);
            console.log("Uploaded image URL:", response.data.url);
          } else if (response?.url) {
            setUploadedImageUrl(response.url);
            console.log("Uploaded image URL (direct):", response.url);
          } else if (response?.payload?.url) {
            setUploadedImageUrl(response.payload.url);
            console.log("Uploaded image URL (payload):", response.payload.url);
          } else if (response?.payload?.data?.url) {
            setUploadedImageUrl(response.payload.data.url);
            console.log("Uploaded image URL (payload.data):", response.payload.data.url);
          } else {
            console.log("No URL found in response:", response);
          }
          setIsUploading(false);
          setMediaLoading(false);
        },
        (error) => {
          // Error callback
          console.log("Upload error:", error);
          showMessage({
            message: `Failed to upload ${uploadType === "COVER" ? "cover" : "profile"
              } image. Please try again.`,
            type: "warning",
          });
          setIsUploading(false);
          setMediaLoading(false);
        }
      ));
      console.log(response, "response upload file");
    } catch (error) {
      console.error("Media Picker Error:", error);
      showMessage({
        message: `Failed to upload ${uploadType === "COVER" ? "cover" : "profile"
          } image. Please try again.`,
        type: "warning",
      });
      setIsUploading(false);
      setMediaLoading(false);
    }
  };
  const showUploadOptions = (type: "COVER" | "PROFILE") => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await handleImagePicker("camera", type);
          } else if (buttonIndex === 2) {
            await handleImagePicker("library", type);
          }
        }
      );
    } else {
      Alert.alert("Upload Media", "Choose an option", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Take Photo",
          onPress: async () => await handleImagePicker("camera", type),
        },
        {
          text: "Choose from Library",
          onPress: async () => await handleImagePicker("library", type),
        },
      ]);
    }
  };

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
            <SafeText style={styles.modalTitle}>Select Country</SafeText>
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
                <SafeText style={styles.countryFlag}>{item.emoji}</SafeText>
                <SafeText style={styles.countryName}>{item.name}</SafeText>
                <SafeText style={styles.countryCode}>+{item.callingCode[0]}</SafeText>
              </TouchableOpacity>
            )}
            style={styles.countryList}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={{ ...styles.container, backgroundColor: Colors.black }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.languageContainer}>
            <LanguageSelector />
          </View>
        </View>
        <View style={styles.formContainer}>
          <SafeText style={styles.title}>{t("auth.register.title")}</SafeText>
          <SafeText style={styles.subtitle}>{t("auth.register.subtitle")}</SafeText>

          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={() => showUploadOptions("PROFILE")} disabled={isUploading}>
              <Image
                source={
                  localImageUri
                    ? { uri: localImageUri }
                    : require("../../../assets/dummyImage.png")
                }
                style={styles.profileImage}
              />
              <View style={styles.editButton}>
                <Text style={styles.editIcon}>{"✎"}</Text>
              </View>
            </TouchableOpacity>
            {isUploading && (
              <View style={styles.uploadIndicator}>
                <SafeText style={styles.uploadText}>Uploading...</SafeText>
              </View>
            )}
            {!!uploadedImageUrl && (
              <View style={styles.uploadSuccessIndicator}>
                <SafeText style={styles.uploadSuccessText}>✓ Uploaded</SafeText>
              </View>
            )}
          </View>
          {(route?.params as any)?.type === "merchant" && (
            <View style={styles.containerDropdown}>
              <SafeText style={[styles.label]}>
                {t("profile.merchantTypes.merchantType")}
              </SafeText>

              <DropDownPicker
                open={open}
                value={value}
                items={items}
                setOpen={setOpen}
                setValue={setValue}
                setItems={setItems}
                ArrowDownIconComponent={() => (
                  <ChevronDown color={Colors.text} size={24} />
                )}
                ArrowUpIconComponent={() => (
                  <ChevronUp color={Colors.text} size={24} />
                )}
                placeholder={t("buttons.select")}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
              />
            </View>
          )}

          {(route?.params as any)?.type == "merchant" && (
            <Input
              label={t("auth.register.companyName")}
              placeholder={t("auth.register.companyNamePlaceholder")}
              value={companyName}
              onChangeText={setCompanyName}
              leftIcon={<Building2 size={20} color={Colors.gray400} />}
            />
          )}

          <Input
            label={t("auth.register.fullName")}
            placeholder={t("auth.register.fullNamePlaceholder")}
            value={name}
            onChangeText={setName}
            leftIcon={<User size={20} color={Colors.gray400} />}
          />

          <Input
            label={t("auth.register.email")}
            placeholder={t("auth.register.emailPlaceholder")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={Colors.gray400} />}
          />

          {/* Country Selection */}
          <View style={styles.countryContainer}>
            <SafeText style={styles.label}>{t("profile.info.country")}</SafeText>
            <TouchableOpacity
              style={styles.countryPickerButton}
              onPress={() => setCountryPickerVisible(true)}
            >
              <View style={styles.countryPickerContent}>
                <SafeText style={styles.countryFlag}>{selectedCountry.emoji}</SafeText>
                <SafeText style={styles.countryNameText}>
                  {selectedCountry.name} (+{selectedCountry.callingCode[0]})
                </SafeText>
              </View>
              <ChevronDown size={16} color={Colors.gray400} />
            </TouchableOpacity>
          </View>

          {/* Phone Number Input */}
          <Input
            label={t("auth.register.phone")}
            placeholder={t("auth.register.phonePlaceholder")}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={
              <View style={styles.phonePrefix}>
                <SafeText style={styles.phonePrefixText}>{countryCode}</SafeText>
              </View>
            }
          />

          <Input
            label={t("auth.register.password")}
            placeholder={t("auth.register.passwordPlaceholder")}
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Lock size={20} color={Colors.gray400} />}
          />

          <Input
            label={t("auth.register.confirmPassword")}
            placeholder={t("auth.register.confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            leftIcon={<Lock size={20} color={Colors.gray400} />}
          />

          <View style={styles.termsContainer}>
            <SafeText style={styles.termsText}>
              {t("auth.register.termsText").split("Terms of Service")[0]}
              <SafeText
                onPress={() => navigation.navigate(Routes.TermsScreen)}
                style={styles.termsLink}
              >
                {t("auth.register.termsService")}
              </SafeText>
              {" and "}
              <SafeText
                onPress={() => navigation.navigate(Routes.PrivacyPolicyScreen)}
                style={styles.termsLink}
              >
                {t("auth.register.privacyPolicy")}
              </SafeText>
            </SafeText>
          </View>

          {/* Agreement Checkbox - Only show when a role is selected */}
          {shouldShowAgreement() && (
            <View style={styles.agreementContainer}>
              <TouchableOpacity
                style={styles.agreementCheckboxRow}
                onPress={() => setAgreementAccepted(!agreementAccepted)}
                activeOpacity={0.7}
              >
                <View style={[styles.agreementCheckbox, !!agreementAccepted && styles.agreementCheckboxChecked]}>
                  {!!agreementAccepted && <Check size={16} color={Colors.white} />}
                </View>
                <SafeText style={styles.agreementCheckboxLabel}>
                  {t("auth.register.iAgreeToAgreement") || "I agree to the"}
                </SafeText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAgreementModalVisible(true)}>
                <SafeText style={styles.agreementLink}>
                  {t("auth.register.userAgreement") || `${getUserType()!.charAt(0).toUpperCase() + getUserType()!.slice(1)} Agreement`}
                </SafeText>
              </TouchableOpacity>
            </View>
          )}

          <Button
            title={t("auth.register.createAccount")}
            variant="primary"
            fullWidth
            loading={loading || isUploading}
            onPress={handleRegister}
            style={styles.registerButton}
            disabled={isUploading || (shouldShowAgreement() && !agreementAccepted)}
          />

          <View style={styles.loginContainer}>
            <SafeText style={styles.loginText}>
              {t("auth.register.haveAccount")}{" "}
              <SafeText
                style={styles.loginLink}
                onPress={() => navigation.navigate(Routes.LoginScreen)}
              >
                {t("auth.login.signIn")}
              </SafeText>
            </SafeText>
          </View>
        </View>
      </ScrollView>

      {/* Custom Country Picker Modal */}
      {renderCountryPicker()}

      {/* Agreement Modal - Only render when a role is selected */}
      {shouldShowAgreement() && renderAgreementModal()}
    </KeyboardAvoidingView>
  );
}

export { RegisterScreen };

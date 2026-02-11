/**
 * Profile Screen
 * @format
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Linking } from "react-native";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import {
  User,
  Settings,
  FileText,
  Star,
  Truck,
  Building2,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  LogOut,
  CreditCard,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Wallet,
  BanknoteIcon,
  CreditCardIcon,
  Plus,
  Check,
  Trash2,
  Edit,
  Bell,
  Activity,
} from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { logoutApp, selectCompany, selectProfile, selectDocumentTypes, fetchDocumentTypes } from "@app/module/common";
import { disconnectSocket } from "@app/service";
import { fetchProfile } from "../index";
import { useTranslation } from "react-i18next";
import { useLocationStore } from "@app/store/locationStore";
import { reverseGeocode, formatLocationDisplay, LocationInfo } from "@app/utils/geocoding";
import { paymentService, Transaction as WalletTransaction } from "@app/service/payment-service";
import moment from "moment";
import { showMessage } from "react-native-flash-message";

//Screens
import { Colors } from "@app/styles";
import { useAuthStore } from "@app/store/authStore";
import { usePaymentStore } from "@app/store/paymentStore";
import { Button } from "@app/components/Button";
import { ProfileScreenSkeleton } from "@app/components/SkeletonLoader";
import { DriverProfile, MerchantProfile } from "@app/types";
import { BankAccount } from "@app/service/payment-service";
import { formatCurrency } from "@app/utils/formatters";
import { useThemedStyle } from "@app/styles";
import { getStyles } from "./styles";
import { Routes } from "../../../navigator";
import { profile } from "../slice";

function ProfileScreen() {
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const route = useRoute();
  const {  logout } = useAuthStore();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const userProfile = useSelector(selectProfile);
  const userRole = userProfile?.roles?.[0]?.role?.name || null;
  // Location store (align with HomeScreen)
  const {
    currentLocation,
    locationPermission,
    requestLocationPermission,
    startLocationTracking,
  } = useLocationStore();

  const companyProfile = useSelector(selectCompany);
  const documentTypes = useSelector(selectDocumentTypes);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<WalletTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const {
    balance,
    pendingBalance,
    paymentMethods,
    bankAccounts,
    transactions,
    isLoading: paymentLoading,
    bankAccountsLoading,
    error: paymentError,
    fetchWalletBalance,
    fetchBankAccounts,
    deleteBankAccount,
    setDefaultPaymentMethod,
    removePaymentMethod,
  } = usePaymentStore();
  
  // Debug PaymentStore initialization
  console.log('🏦 ProfileScreen: PaymentStore initialized:', {
    fetchBankAccounts: typeof fetchBankAccounts,
    fetchWalletBalance: typeof fetchWalletBalance,
    bankAccounts: bankAccounts,
    bankAccountsLoading: bankAccountsLoading
  });

  console.log({ userProfile, userRole }, "userprofile");
  console.log("💰 Profile Screen - Wallet Balance:", { balance, pendingBalance, paymentLoading, paymentError });
  console.log("🏦 Profile Screen - Bank Accounts:", { 
    bankAccountsCount: bankAccounts.length, 
    bankAccountsLoading, 
    bankAccounts: bankAccounts,
    bankAccountsData: bankAccounts.map(acc => ({
      id: acc.id,
      accountName: acc.accountName,
      bankName: acc.bankName,
      isVerified: acc.isVerified,
      isDefault: acc.isDefault
    }))
  });
  
  // Additional debugging for UI rendering
  console.log("🏦 Profile Screen - UI State:", {
    shouldShowBankAccounts: bankAccounts.length > 0,
    isLoading: isLoading,
    bankAccountsLoading: bankAccountsLoading,
    renderCondition: `bankAccounts.length > 0: ${bankAccounts.length > 0}`
  });

  const [activeTab, setActiveTab] = useState<
    "profile" | "transactions" | "payment"
  >("profile");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // Fetch document types when component mounts
  useFocusEffect(
    useCallback(() => {
      console.log('🏦 ProfileScreen: useFocusEffect triggered!');
      
      // Check if this is a deep link return - if so, don't show skeleton
      const deepLink = (route.params as any)?.deepLink;
      const isDeepLink = deepLink === 'profilescreen';
      
      // Check if we already have data loaded
      const hasExistingData = userProfile && documentTypes !== undefined;
      
      // Ensure location tracking similar to HomeScreen - ONLY for drivers
      if (userRole === "driver") {
        (async () => {
          try {
            if (!locationPermission) {
              const granted = await requestLocationPermission();
              if (granted) {
                startLocationTracking();
              }
            } else {
              startLocationTracking();
            }
          } catch (e) {}
        })();
      }
      
      // Only show skeleton on initial load or if we don't have data
      // Don't show skeleton when returning from deep link or if data already exists
      if (!isDeepLink && !isDeepLinkReturn.current && !hasExistingData) {
        setIsLoading(true);
      } else if ((hasExistingData || isDeepLink || isDeepLinkReturn.current) && isLoading) {
        // If we have data or it's a deep link return, and skeleton is showing, hide it immediately
        setIsLoading(false);
      }
      
      // Fetch data immediately (always refresh data)
      dispatch(fetchProfile({}));
      dispatch(fetchDocumentTypes());
      fetchWalletBalance(); // Fetch wallet balance from API
      
      console.log('🏦 ProfileScreen: About to call fetchBankAccounts...');
      console.log('🏦 ProfileScreen: fetchBankAccounts function:', typeof fetchBankAccounts);
      console.log('🏦 ProfileScreen: fetchBankAccounts function details:', fetchBankAccounts);
      
      if (typeof fetchBankAccounts === 'function') {
        const uid = userProfile?.id || userProfile?.userId;
        fetchBankAccounts(uid as any); // Fetch bank accounts from API with userId
        console.log('🏦 ProfileScreen: fetchBankAccounts called successfully');
      } else {
        console.error('🏦 ProfileScreen: fetchBankAccounts is not a function!', fetchBankAccounts);
      }
      
      // Test connection (optional debugging)
      // paymentService.testConnection();
      (async () => {
        try {
          setTxLoading(true);
          const tx = await paymentService.getTransactions(5, 0);
          setRecentTransactions(tx);
        } catch (e) {
        } finally {
          setTxLoading(false);
        }
      })();

    }, [dispatch, fetchWalletBalance, fetchBankAccounts, userProfile, userRole, locationPermission, requestLocationPermission, startLocationTracking])
  );

  // Track if we've already refreshed from deep link to prevent multiple refreshes
  const hasRefreshedFromDeepLink = useRef(false);
  const isDeepLinkReturn = useRef(false);

  // Track the last processed deep link to prevent duplicate processing
  const lastProcessedDeepLink = useRef<string | null>(null);

  // Refresh data when returning from deep link
  useEffect(() => {
    const deepLink = (route.params as any)?.deepLink;
    const deepLinkValue = deepLink === 'profilescreen' ? 'profilescreen' : null;
    
    // Only process if deep link is detected, hasn't been processed yet, and we haven't refreshed
    if (deepLinkValue === 'profilescreen' && 
        deepLinkValue !== lastProcessedDeepLink.current && 
        !hasRefreshedFromDeepLink.current) {
      console.log('🏦 ProfileScreen: Deep link detected, refreshing data...');
      lastProcessedDeepLink.current = deepLinkValue;
      hasRefreshedFromDeepLink.current = true;
      isDeepLinkReturn.current = true;
      
      // Ensure skeleton is hidden when returning from deep link
      setIsLoading(false);
      
      // Refresh the data in the background
      // Get current user ID
      const uid = userProfile?.id || (userProfile as any)?.userId;
      
      if (uid) {
        // Refresh all profile data without showing loading skeleton
        dispatch(fetchProfile({}));
        fetchWalletBalance(); // Use hook function directly
        fetchBankAccounts(uid as any); // Use hook function directly
        dispatch(fetchDocumentTypes());
        
        // Also refresh transactions
        (async () => {
          try {
            setTxLoading(true);
            const tx = await paymentService.getTransactions(5, 0);
            setRecentTransactions(tx);
          } catch (e) {
            console.error('Error refreshing transactions:', e);
          } finally {
            setTxLoading(false);
          }
        })();
      }
      
      showMessage({ 
        message: t("common.success"), 
        description: t("common.bankAccountsUpdatedSuccess") || "Bank accounts Added/Updated successfully!",
        type: 'success' 
      });
      
      // Reset the refs after a delay to allow future deep link refreshes
      setTimeout(() => {
        hasRefreshedFromDeepLink.current = false;
        isDeepLinkReturn.current = false;
      }, 5000);
    } else if (!deepLinkValue && lastProcessedDeepLink.current) {
      // Reset when deep link param is cleared
      setTimeout(() => {
        lastProcessedDeepLink.current = null;
        hasRefreshedFromDeepLink.current = false;
        isDeepLinkReturn.current = false;
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(route.params as any)?.deepLink]); // Only depend on deepLink to prevent re-runs

  // Hide skeleton when data is loaded
  useEffect(() => {
    console.log('🏦 ProfileScreen: Skeleton hiding check:', {
      isLoading,
      userProfile: !!userProfile,
      documentTypes: documentTypes !== undefined,
      paymentLoading,
      bankAccountsLoading,
      shouldHide: isLoading && userProfile && documentTypes !== undefined && !paymentLoading
    });
    
    // Hide skeleton when basic profile data is loaded (don't wait for bank accounts)
    // Also check if we're returning from deep link - if so, ensure skeleton is hidden
    const deepLink = (route.params as any)?.deepLink;
    const isDeepLink = deepLink === 'profilescreen';
    
    if (isLoading && userProfile && documentTypes !== undefined && !paymentLoading) {
      console.log('🏦 ProfileScreen: Hiding skeleton - basic data loaded');
      setIsLoading(false);
    } else if ((isDeepLink || isDeepLinkReturn.current) && isLoading) {
      // If returning from deep link and skeleton is showing, hide it immediately
      console.log('🏦 ProfileScreen: Hiding skeleton - deep link return');
      setIsLoading(false);
    }
  }, [isLoading, userProfile, documentTypes, paymentLoading, route]);

  // Fallback timeout to hide skeleton if data doesn't load
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('🏦 ProfileScreen: Fallback timeout - hiding skeleton');
        setIsLoading(false);
      }
    }, 5000); // 5 second fallback
    
    return () => clearTimeout(timeout);
  }, [isLoading]);
  
  // Monitor bank accounts changes
  useEffect(() => {
    console.log('🏦 Profile Screen: Bank accounts changed:', {
      count: bankAccounts.length,
      loading: bankAccountsLoading,
      accounts: bankAccounts
    });
  }, [bankAccounts, bankAccountsLoading]);

  // Auto-select first bank account when bank accounts are loaded
  useEffect(() => {
    if (bankAccounts.length > 0 && !selectedMethod) {
      const firstAccount = bankAccounts[0];
      const accountKey = firstAccount.externalBankId || firstAccount.id;
      console.log('🏦 ProfileScreen: Auto-selecting first bank account:', accountKey);
      setSelectedMethod(accountKey);
    }
  }, [bankAccounts, selectedMethod]);
  
  // Fallback timeout to hide skeleton after 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('🏦 ProfileScreen: Fallback timeout - hiding skeleton');
        setIsLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Resolve human-readable location name when coordinates change
  useEffect(() => {
    const fetchReadableLocation = async () => {
      if (!currentLocation) {
        setLocationInfo(null);
        return;
      }
      setLocationLoading(true);
      try {
        const info = await reverseGeocode(currentLocation.latitude, currentLocation.longitude);
        setLocationInfo(info);
      } catch (e) {
        // ignore, keep previous
      } finally {
        setLocationLoading(false);
      }
    };
    fetchReadableLocation();
  }, [currentLocation]);

  // Show skeleton while loading
  if (isLoading) {
    return <ProfileScreenSkeleton userRole={userRole} />;
  }

  // Safety check - if no user profile, show loading or redirect
  if (!userProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.white }}>Loading profile...</Text>
      </View>
    );
  }

  // Function to render uploaded documents
  const renderUploadedDocuments = () => {
    console.log("renderUploadedDocuments called with documentTypes:", documentTypes);
    
    if (!documentTypes || documentTypes.length === 0) {
      console.log("No document types available");
      return (
        <View style={styles.documentItem}>
          <View style={styles.documentIcon}>
            <FileText size={20} color={Colors.white} />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>No documents uploaded</Text>
            <Text style={styles.documentSubtitle}>Upload your documents to get started</Text>
          </View>
          <ChevronRight size={20} color={Colors.gray400} />
        </View>
      );
    }

    // Filter documents that are actually uploaded
    const uploadedDocuments = documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded);
    console.log("Filtered uploaded documents:", uploadedDocuments);
    
    if (uploadedDocuments.length === 0) {
      console.log("No uploaded documents found");
      return (
        <View style={styles.documentItem}>
          <View style={styles.documentIcon}>
            <FileText size={20} color={Colors.white} />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>No documents uploaded</Text>
            <Text style={styles.documentSubtitle}>Upload your documents to get started</Text>
          </View>
          <ChevronRight size={20} color={Colors.gray400} />
        </View>
      );
    }

    // Show first 3 uploaded documents
    console.log("Rendering", uploadedDocuments.length, "uploaded documents");
    return uploadedDocuments.slice(0, 3).map((doc: any, index: number) => (
      <View key={doc.id || index} style={styles.documentItem}>
        <View style={styles.documentIcon}>
          <FileText size={20} color={Colors.white} />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle}>
            {doc.displayName || doc.description || doc.name}
          </Text>
         {doc.expiryDate && <Text style={styles.documentSubtitle}>
            {doc.expiryDate ? `Expires: ${new Date(doc.expiryDate).toLocaleDateString()}` : 'No expiry date'}
          </Text>}
          <View style={styles.documentStatus}>
            <Text style={[
              styles.statusText,
              doc.status === 'verified' ? styles.statusVerified : 
              doc.status === 'rejected' ? styles.statusRejected : 
              doc.status === 'expired' ? styles.statusExpired :
              styles.statusPending
            ]}>
              {doc.status || 'Pending'}
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={Colors.gray400} />
      </View>
    ));
  };

  const handleLogout = () => {
    try {
      // Disconnect socket
      disconnectSocket();
      // Clear Zustand store
      logout();
      // Clear Redux store
      dispatch(logoutApp());
      // Navigate to login screen
      navigation.navigate(Routes.LoginScreen as never);
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: just clear stores and navigate
      disconnectSocket();
      logout();
      dispatch(logoutApp());
      navigation.navigate(Routes.LoginScreen as never);
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const NotificationService = await import('@app/service/notification-service');
      const granted = await NotificationService.default.requestPermission();
      if (granted) {
        // Show success message
        console.log('Notification permission granted');
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleSetDefault = (methodId: string) => {
    setDefaultPaymentMethod(methodId);
  };

  const handleRemoveMethod = (methodId: string) => {
    removePaymentMethod(methodId);
  };

  const handleDeleteBankAccount = async (accountId: string) => {
    try {
      console.log('🏦 ProfileScreen: Deleting bank account:', accountId);
      await deleteBankAccount(accountId);
      console.log('🏦 ProfileScreen: Bank account deleted successfully');
    } catch (error) {
      console.error('🏦 ProfileScreen: Error deleting bank account:', error);
    }
  };

  const handleManagePayments = async () => {
    try {
      const uid = userProfile?.id || userProfile?.userId;
      if (!uid) { return; }
      
      // Build returnUrl with query parameters for deep linking
      const baseUrl = 'https://api.gofrts.com/app/return';
      const params = new URLSearchParams({
        host: 'open',
        path: 'ProfileScreen',
        scheme: 'gofrts://open/ProfileScreen',
        package: 'com.coinbase',
        fallback: 'https://www.gofrts.com/',
        reason: 'done',
      });
      const returnUrl = `${baseUrl}?${params.toString()}`;
      const refreshUrl = returnUrl; // Use same URL for refreshUrl
      
      const link = await paymentService.createConnectAccountLink({
        userId: uid.toString(),
        type: 'account_onboarding',
        refreshUrl,
        returnUrl,
      });
      
      if (link?.url) {
        await Linking.openURL(link.url);
      }
    } catch (e) {
      console.error('Error managing payments:', e);
      showMessage({
        message: t("common.error"),
        description: t("common.failedToManagePayments"),
        type: "danger",
      });
    }
  };

  const renderTransactionIcon = (type: string, status: string) => {
    if (status === "failed") {
      return <AlertCircle size={20} color={Colors.error} />;
    }

    if (type === "payment") {
      return userRole === "driver" ? (
        <ArrowDownLeft size={20} color={Colors.success} />
      ) : (
        <ArrowUpRight size={20} color={Colors.error} />
      );
    } else if (type === "withdrawal") {
      return <ArrowUpRight size={20} color={Colors.error} />;
    } else if (type === "deposit") {
      return <ArrowDownLeft size={20} color={Colors.success} />;
    } else if (type === "refund") {
      return userRole === "driver" ? (
        <ArrowUpRight size={20} color={Colors.error} />
      ) : (
        <ArrowDownLeft size={20} color={Colors.success} />
      );
    }

    return <DollarSign size={20} color={Colors.primary} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return Colors.success;
      case "pending":
        return Colors.warning;
      case "processing":
        return Colors.info;
      case "failed":
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "processing":
        return "Processing";
      case "failed":
        return "Failed";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const renderTransactionItem = (transaction: any) => {
    const isIncoming =
      (userRole === "driver" && transaction.type === "payment") ||
      (userRole === "merchant" && transaction.type === "refund") ||
      transaction.type === "deposit";

    const isOutgoing =
      (userRole === "merchant" && transaction.type === "payment") ||
      (userRole === "driver" && transaction.type === "refund") ||
      transaction.type === "withdrawal";

    const formattedDate = transaction.date ? moment(transaction.date).format("DD MMM YYYY, hh:mm A") : "";

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() =>
          navigation.navigate(Routes.TransactionDetailScreen, {
            transactionId: transaction.id,
            transaction,
          })
        }
      >
        <View
          style={[
            styles.transactionIconContainer,
            {
              backgroundColor:
                transaction.status === "failed"
                  ? Colors.error + "20"
                  : Colors.primary + "20",
            },
          ]}
        >
          {renderTransactionIcon(transaction.type, transaction.status)}
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{transaction.description}</Text>
          <Text style={styles.transactionDate}>{formattedDate}</Text>
        </View>

        <View style={styles.transactionAmount}>
          <Text
            style={[
              styles.transactionAmountText,
              isIncoming
                ? styles.amountPositive
                : isOutgoing
                ? styles.amountNegative
                : {},
            ]}
          >
            {isIncoming ? "+" : isOutgoing ? "-" : ""}
            {formatCurrency(transaction.amount, "USD")}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(transaction.status) + "20" },
            ]}
          >
            <Text
              style={[styles.statusText, { color: getStatusColor(transaction.status) }]}
            >
              {getStatusText(transaction.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBankAccountItem = (account: BankAccount) => {
    const accountKey = account.externalBankId || account.id;
    const isSelected = selectedMethod === accountKey;

    return (
      <TouchableOpacity
        key={account.id}
        style={[
          styles.paymentMethodItem,
          isSelected && styles.selectedPaymentMethod,
        ]}
        onPress={() => setSelectedMethod(isSelected ? null : accountKey)}
      >
        <View style={styles.paymentMethodIconContainer}>
          <Building2 size={24} color={Colors.primary} />
        </View>

        <View style={styles.paymentMethodInfo}>
          <Text style={styles.paymentMethodTitle}>
            {account.accountName || `Account ****${account.last4 || account.accountNumber.slice(-4)}`}
          </Text>
          <Text style={styles.paymentMethodSubtitle}>
            {account.bankName} - {account.accountType}
          </Text>
          <Text style={styles.paymentMethodSubtitle}>
            ****{account.last4 || account.accountNumber.slice(-4)}
          </Text>
        </View>

        {account.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}

        {account.isVerified && (
          <View style={styles.verifiedBadge}>
            <Check size={16} color={Colors.success} />
          </View>
        )}

        {isSelected ? (
          <View style={styles.selectedActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(accountKey)}
              disabled={account.isDefault}
            >
              <Check
                size={20}
                color={account.isDefault ? Colors.textSecondary : Colors.success}
              />
            </TouchableOpacity>

                {/* <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteBankAccount(account.externalBankId || account.id)}
                  disabled={account.isDefault}
                >
                  <Trash2
                    size={20}
                    color={account.isDefault ? Colors.textSecondary : Colors.error}
                  />
                </TouchableOpacity> */}
          </View>
        ) : (
          <ChevronRight size={20} color={Colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderPaymentMethodItem = (method: any) => {
    const isSelected = selectedMethod === method.id;
    const cardTypeIcon = () => {
      switch (method.type) {
        case "visa":
          return <CreditCardIcon size={24} color={Colors.primary as string} />;
        case "mastercard":
          return <CreditCardIcon size={24} color={Colors.primary} />;
        case "bank":
          return <BanknoteIcon size={24} color={Colors.primary} />;
        default:
          return <CreditCard size={24} color={Colors.primary} />;
      }
    };

    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.paymentMethodItem,
          isSelected && styles.selectedPaymentMethod,
        ]}
        onPress={() => setSelectedMethod(isSelected ? null : method.id)}
      >
        <View style={styles.paymentMethodIconContainer}>{cardTypeIcon()}</View>

        <View style={styles.paymentMethodInfo}>
          <Text style={styles.paymentMethodTitle}>
            {method.type === "bank"
              ? "Bank Account"
              : `${method.brand} ****${method.last4}`}
          </Text>
          <Text style={styles.paymentMethodSubtitle}>
            {method.type === "bank"
              ? `${method.bankName} - ${method.accountType}`
              : `Expires ${method.expMonth}/${method.expYear}`}
          </Text>
        </View>

        {method.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}

        {isSelected ? (
          <View style={styles.selectedActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(method.id)}
              disabled={method.isDefault}
            >
              <Check
                size={20}
                color={method.isDefault ? Colors.textSecondary : Colors.success}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRemoveMethod(method.id)}
              disabled={method.isDefault}
            >
              <Trash2
                size={20}
                color={method.isDefault ? Colors.textSecondary : Colors.error}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <ChevronRight size={20} color={Colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderDriverProfile = (profile: DriverProfile) => (
    <>
      <View style={styles.balanceSection}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>
            {" "}
            {t("profile.balance.available")}
          </Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(balance, "USD")}
          </Text>
        </View>

        { (
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>
              {" "}
              {t("profile.balance.pending")}
            </Text>
            <Text style={styles.pendingValue}>
              {formatCurrency(pendingBalance, "USD")}
            </Text>
          </View>
        )}

        <View style={styles.balanceActions}>
          <TouchableOpacity
            style={styles.balanceActionButton}
            onPress={() => navigation.navigate(Routes.WithdrawScreen)}
          >
            <Wallet size={20} color={Colors.white} style={styles.actionIcon} />
            <Text style={styles.actionText}>
              {t("profile.balance.withdraw")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Truck size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.truckType")}</Text>
            <Text style={styles.infoValue}>{profile?.trucks?.[0]?.truckType?.name}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Star size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.rating")}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingValue}>
                {profile?.rating?.toFixed(1)}
              </Text>
              <Text style={styles.ratingIcon}>★</Text>
              <Text style={styles.ratingCount}>
                ({profile.completedJobs} jobs)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>
              {t("profile.info.currentLocation")}
            </Text>
            <Text style={styles.infoValue}>
              {profile.currentLocation
                ? `Lat: ${profile?.currentLocation?.latitude?.toFixed(
                    6
                  )}, Lng: ${profile?.currentLocation?.longitude?.toFixed(6)}`
                : "Not available"}
            </Text>
          </View>
        </View>
      </View>

      {/* Documents Section */}
      <View style={styles.documentsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("profile.documents.title")}</Text>
          <TouchableOpacity
            style={styles.manageDocsButton}
            onPress={() => navigation.navigate(Routes.DocumentsScreen)}
          >
            <Edit size={16} color={Colors.white} />
            <Text style={styles.manageDocsText}>Manage Docs</Text>
          </TouchableOpacity>
        </View>

        {/* Render actual uploaded documents */}
        {renderUploadedDocuments()}

        {/* Show more documents indicator if there are more than 3 */}
        {documentTypes && documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded).length > 3 && (
          <TouchableOpacity
            style={styles.seeMoreDocuments}
            onPress={() => navigation.navigate(Routes.DocumentsScreen)}
          >
            <Text style={styles.seeMoreText}>
              View all {documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded).length} documents
            </Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const renderMerchantProfile = (profile: MerchantProfile) => (
    <>
      <View style={styles.balanceSection}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>
            {" "}
            {t("profile.balance.available")}
          </Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(balance, "USD")}
          </Text>
        </View>

        { (
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>
              {" "}
              {t("profile.balance.pending")}
            </Text>
            <Text style={styles.pendingValue}>
              {formatCurrency(pendingBalance, "USD")}
            </Text>
          </View>
        )}

        <View style={styles.balanceActions}>
          <TouchableOpacity
            style={styles.balanceActionButton}
            onPress={() => navigation.navigate(Routes.DepositScreen)}
          >
            <Wallet size={20} color={Colors.white} style={styles.actionIcon} />
            <Text style={styles.actionText}>
              {t("profile.balance.addFunds")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Building2 size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.company")}</Text>
            <Text style={styles.infoValue}>
              {(() => {
                const company = profile.company as any;
                return typeof company === 'string' 
                  ? company 
                  : company?.companyName || 'N/A';
              })()}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Star size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.rating")}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingValue}>
                {profile?.rating?.toFixed(1)}
              </Text>
              <Text style={styles.ratingIcon}>★</Text>
              <Text style={styles.ratingCount}>
                ({profile.completedJobs} jobs)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.address")}</Text>
            <Text style={styles.infoValue}>{profile.address}</Text>
          </View>
        </View>
      </View>

      <View style={styles.documentsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("profile.documents.title")}</Text>
          <TouchableOpacity
            style={styles.manageDocsButton}
            onPress={() => navigation.navigate(Routes.DocumentsScreen)}
          >
            <Edit size={16} color={Colors.white} />
            <Text style={styles.manageDocsText}>Manage Docs</Text>
          </TouchableOpacity>
        </View>

        {/* Render actual uploaded documents */}
        {renderUploadedDocuments()}

        {/* Show more documents indicator if there are more than 3 */}
        {documentTypes && documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded).length > 3 && (
          <TouchableOpacity
            style={styles.seeMoreDocuments}
            onPress={() => navigation.navigate(Routes.DocumentsScreen)}
          >
            <Text style={styles.seeMoreText}>
              View all {documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded).length} documents
            </Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </>
  );
  const renderCarrierProfile = (profile: DriverProfile & MerchantProfile) => (
    <>
      {/* Balance Section */}
      <View style={styles.balanceSection}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>
            {t("profile.balance.available")}
          </Text>
          <Text style={styles.balanceValue}>
            {formatCurrency(balance, "USD")}
          </Text>
        </View>

        {(
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>
              {t("profile.balance.pending")}
            </Text>
            <Text style={styles.pendingValue}>
              {formatCurrency(pendingBalance, "USD")}
            </Text>
          </View>
        )}

        <View
          style={{ ...styles.balanceActions, justifyContent: "space-around" }}
        >
          {/* Carrier can both withdraw and add funds */}
          <TouchableOpacity
            style={styles.balanceActionButton}
            onPress={() => navigation.navigate(Routes.WithdrawScreen)}
          >
            <Wallet size={20} color={Colors.white} style={styles.actionIcon} />
            <Text style={styles.actionText}>
              {t("profile.balance.withdraw")}
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.balanceActionButton}
            onPress={() => navigation.navigate(Routes.DepositScreen)}
          >
            <Wallet size={20} color={Colors.white} style={styles.actionIcon} />
            <Text style={styles.actionText}>
              {t("profile.balance.addFunds")}
            </Text>
          </TouchableOpacity> */}
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        {/* Truck Type (Driver-specific) */}
        {/* <View style={styles.infoRow}>
          <Truck size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.truckType")}</Text>
            <Text style={styles.infoValue}>{profile.truckType}</Text>
          </View>
        </View> */}

        {/* Company (Merchant-specific) */}
        <View style={styles.infoRow}>
          <Building2 size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.company")}</Text>
            <Text style={styles.infoValue}>{profile.company?.companyName || profile.company || 'N/A'}</Text>
          </View>
        </View>

        {/* Rating (Shared) */}
        <View style={styles.infoRow}>
          <Star size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.rating")}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingValue}>
                {profile?.rating?.toFixed(1)}
              </Text>
              <Text style={styles.ratingIcon}>★</Text>
              <Text style={styles.ratingCount}>
                ({profile.completedJobs} jobs)
              </Text>
            </View>
          </View>
        </View>

        {/* Location (Driver) */}
        <View style={styles.infoRow}>
          <MapPin size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>
              {t("profile.info.currentLocation")}
            </Text>
            <Text style={styles.infoValue}>
              {locationInfo
                ? formatLocationDisplay(locationInfo)
                : (currentLocation
                    ? `Lat: ${currentLocation.latitude.toFixed(6)}, Lng: ${currentLocation.longitude.toFixed(6)}`
                    : "Not available")}
            </Text>
          </View>
        </View>

        {/* Address (Merchant) */}
        <View style={styles.infoRow}>
          <MapPin size={20} color={Colors.gray600} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t("profile.info.address")}</Text>
            <Text style={styles.infoValue}>{companyProfile?.address }, {companyProfile?.city}, {companyProfile?.state}, {companyProfile?.zipCode}  </Text>
          </View>
        </View>
      </View>

      {/* Documents Section */}
      <View style={styles.documentsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("profile.documents.title")}</Text>
          <TouchableOpacity
            style={styles.manageDocsButton}
            onPress={() => navigation.navigate(Routes.DocumentsScreen)}
          >
            <Edit size={16} color={Colors.white} />
            <Text style={styles.manageDocsText}>Manage Docs</Text>
          </TouchableOpacity>
        </View>

        {/* Render actual uploaded documents */}
        {renderUploadedDocuments()}

        {/* Show more documents indicator if there are more than 3 */}
        {documentTypes && documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded).length > 3 && (
          <TouchableOpacity
            style={styles.seeMoreDocuments}
            onPress={() => navigation.navigate(Routes.DocumentsScreen)}
          >
            <Text style={styles.seeMoreText}>
              View all {documentTypes.filter((doc: any) => doc.fileUrl && doc.isUploaded).length} documents
            </Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const renderTransactionsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceCardLabel}>
            {t("profile.balance.available")}
          </Text>
        </View>

        <Text style={styles.balanceCardAmount}>
          {formatCurrency(balance, "USD")}
        </Text>

        { (
          <View style={styles.pendingContainer}>
            <Text style={styles.pendingLabel}>
              {t("profile.balance.available")}:{" "}
            </Text>
            <Text style={styles.pendingAmount}>
              {formatCurrency(pendingBalance, "USD")}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {t("profile.transactions.recent")}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate(Routes.PaymentHistoryScreen)}
        >
          <Text style={styles.seeAllText}>{t("common.seeAll")}l</Text>
        </TouchableOpacity>
      </View>

      {txLoading ? (
        <View style={styles.emptyState}><Text style={styles.emptyStateDescription}>Loading...</Text></View>
      ) : recentTransactions && recentTransactions.length > 0 ? (
        recentTransactions.map((transaction) => renderTransactionItem(transaction))
      ) : (
        <View style={styles.emptyState}>
          <DollarSign size={40} color={Colors.textSecondary} />
          <Text style={styles.emptyStateTitle}>
            {t("profile.transactions.noTransactions")}
          </Text>
          <Text style={styles.emptyStateDescription}>
            {userRole === "driver"
              ? t("profile.transactions.noTransactionsDriver")
              : t("profile.transactions.noTransactionsMerchant")}
          </Text>
        </View>
      )}
    </View>
  );

  const renderPaymentMethodsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {t("profile.paymentMethods.title")}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleManagePayments}
        >
          <Plus size={16} color={Colors.white} />
          <Text style={styles.addButtonText}>
            {t("profile.paymentMethods.manage")}
          </Text>
        </TouchableOpacity>
      </View>


      
      {/* Show bank accounts from API */}
      {bankAccounts.length > 0 ? (
        bankAccounts.map((account) => renderBankAccountItem(account))
      ) : (
        <View style={styles.emptyState}>
          <CreditCard size={40} color={Colors.textSecondary} />
          <Text style={styles.emptyStateTitle}>
            {t("profile.paymentMethods.noMethods")}
          </Text>
          <Text style={styles.emptyStateDescription}>
            Add a payment method to{" "}
            {userRole === "driver" ? "receive payments" : "pay for jobs"}.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate(Routes.AddPaymentMethodScreen)}
          >
            <Text style={styles.emptyStateButtonText}>
              {t("profile.paymentMethods.addPaymentMethod")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (!userProfile)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          justifyContent: "center",
          padding: 100,
        }}
      >
        <Button
          title={t("buttons.signIn")}
          variant="primary"
          fullWidth
          // loading={loading}
          onPress={handleLogout}
          style={styles.loginButton}
        />
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate(Routes.LanguageSettingsScreen)}
        >
          <Settings size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {userProfile.profileImage ? (
              // <Image
              //   source={{ uri: userProfile.profileImage }}
              //   style={styles.avatar}
              // />
              <Image
              source={
                error || !userProfile?.profileImage
                  ? require("../../../assets/dummyImage.png") // fallback local image
                  : { uri: userProfile.profileImage }
              }
              style={styles.avatar}
              onError={() => setError(true)}
            />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {userProfile?.userName?.charAt(0) || 'U'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => navigation.navigate(Routes.EditProfileScreen)}
            >
              <Edit size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{userProfile?.userName || 'User'}</Text>
          <Text style={styles.userRole}>
          {userProfile?.roles?.[0]?.role?.name?.toUpperCase()}

            {/* {userRole === "driver"
              ? t("home.truckDriver")
              : (userProfile as MerchantProfile).merchantType} */}
          </Text>

          <View style={styles.verificationBadge}>
            <Text style={styles.verificationText}>
              {userProfile.isEmailVerified
                ? t("profile.verifiedAccount")
                : t("profile.verificationPending")}
            </Text>
          </View>

          <Button
            title={t("profile.editProfile")}
            variant="outline"
            onPress={() => navigation.navigate(Routes.EditProfileScreen)}
            style={styles.editButton}
          />
          
   
        </View>

        <View style={styles.contactSection}>
          <View style={styles.contactItem}>
            <Phone
              size={20}
              color={Colors.primary}
              style={styles.contactIcon}
            />
            <Text style={styles.contactText}>{userProfile.phoneCountryCode}-{userProfile.phoneNumber}</Text>
          </View>

          <View style={styles.contactItem}>
            <Mail size={20} color={Colors.primary} style={styles.contactIcon} />
            <Text style={styles.contactText}>{userProfile.email}</Text>
          </View>
        </View>

        {/* Notification Permission Section
        <View style={styles.notificationSection}>
          <View style={styles.notificationHeader}>
            <Bell size={20} color={Colors.primary} style={styles.notificationIcon} />
            <Text style={styles.notificationTitle}>{t("profile.notifications")}</Text>
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationText}>
              {t("profile.notificationDescription")}
            </Text>
            <Button
              title={t("profile.requestNotificationPermission")}
              variant="outline"
              onPress={handleRequestNotificationPermission}
              style={styles.notificationButton}
            />
          </View>
        </View> */}

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "profile" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("profile")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "profile" && styles.activeTabButtonText,
              ]}
            >
              {t("profile.tabs.profile")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "transactions" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("transactions")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "transactions" && styles.activeTabButtonText,
              ]}
            >
              {t("profile.tabs.transactions")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "payment" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("payment")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "payment" && styles.activeTabButtonText,
              ]}
            >
              {t("profile.tabs.paymentMethods")}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "profile" &&
          (userRole === "carrier" || userRole === "broker" || userRole === "shipper") &&
          renderCarrierProfile(userProfile as MerchantProfile)}

        {activeTab === "profile" &&
          userRole === "driver" &&
          renderDriverProfile(userProfile as DriverProfile)}
        {activeTab === "profile" &&
          userRole === "merchant" &&
          renderMerchantProfile(userProfile as MerchantProfile)}

        {activeTab === "transactions" && renderTransactionsTab()}

        {activeTab === "payment" && renderPaymentMethodsTab()}

        {/* <TouchableOpacity 
          style={styles.debugButton} 
          onPress={() => navigation.navigate(Routes.SocketDebugScreen)}
        >
          <Activity size={20} color={Colors.info} style={styles.debugIcon} />
          <Text style={styles.debugText}>Socket Debug</Text>
        </TouchableOpacity> */}
        
    
        
  

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export { ProfileScreen };


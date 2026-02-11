/**
 * WithdrawPayment Screen
 * @format
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CreditCard,
  BanknoteIcon,
  Check,
  CreditCardIcon,
} from "lucide-react-native";

//Screens
import { Colors } from "@app/styles";
import { useAuthStore } from "@app/store/authStore";
import { usePaymentStore } from "@app/store/paymentStore";
import { formatCurrency } from "@app/utils/formatters";
import { Button } from "@app/components/Button";
import { Input } from "@app/components/Input";
import { useThemedStyle } from "@app/styles";
import { Routes } from "../../../navigator";
import { getStyles } from "./styles";
import Header from "@app/components/Header";
import { useSelector } from "react-redux";
import { selectProfile } from "@app/module/common";
import { httpRequest, endPoints, paymentService } from "@app/service";
import { showMessage } from "react-native-flash-message";

function WithdrawScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);

  const navigation = useNavigation();
  const profile = useSelector(selectProfile);
  const {
    balance,
    currency,
    bankAccounts,
    withdrawFunds,
    fetchBankAccounts,
    fetchWalletBalance,
  } = usePaymentStore();

  const [amount, setAmount] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Ensure bank accounts are fetched when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Fetch wallet balance and bank accounts on focus
      fetchWalletBalance();
      const uid = (profile as any)?.id || (profile as any)?.userId;
      if (uid) fetchBankAccounts(uid);
    }, [bankAccounts, fetchBankAccounts, profile])
  );

  // Auto-select first available bank account (externalBankId preferred)
  useEffect(() => {
    if (bankAccounts && bankAccounts.length > 0 && !selectedMethodId) {
      const first = bankAccounts[0];
      const key = (first as any).externalBankId || first.id;
      setSelectedMethodId(key);
    }
  }, [bankAccounts, selectedMethodId]);

  const handleAmountChange = (text: string) => {
    // Remove all non-digits and non-decimal points
    const cleaned = text.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return;
    }

    // Limit to 2 decimal places
    if (parts.length > 1 && parts[1].length > 2) {
      return;
    }

    setAmount(cleaned);
  };

  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      showMessage({
        message: t("common.error"),
        description: t("common.enterValidAmount"),
        type: "danger",
        duration: 3000,
      });
      return false;
    }

    if (parseFloat(amount) > balance) {
      showMessage({
        message: t("common.error"),
        description: t("common.withdrawalAmountExceeds"),
        type: "danger",
        duration: 3000,
      });
      return false;
    }

    if (!selectedMethodId) {
      showMessage({
        message: t("common.error"),
        description: t("common.selectPaymentMethod"),
        type: "danger",
        duration: 3000,
      });
      return false;
    }

    return true;
  };

  const handleWithdraw = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log(
        "Creating withdrawal request for amount:",
        parseFloat(amount)
      );

      // Call the withdrawal API
      const response = await httpRequest.post(endPoints.createWithdrawal, {
        amount: parseFloat(amount),
      });

      console.log("Withdrawal response:", response);

      // Update local state after successful API call
      if (selectedMethodId) {
        withdrawFunds(parseFloat(amount), selectedMethodId);
      }

      // Refresh wallet balance
      fetchWalletBalance();

      // Show success message
      showMessage({
        message: t("common.success"),
        description: `${t("common.withdrawalSuccess")} ${formatCurrency(
          parseFloat(amount),
          "USD"
        )}`,
        type: "success",
        duration: 4000,
      });

      // Navigate back to payment screen after a short delay
      setTimeout(() => {
  navigation.goBack();
        // (navigation as any).navigate(Routes.TransactionDetailScreen, {
        //   transactionId: response?.id,
        //   response,
        // });
      }, 1000);
    } catch (error) {
      console.error("Error processing withdrawal:", error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to process withdrawal. Please try again.";

      showMessage({
        message: t("common.withdrawalFailed"),
        description: errorMessage,
        type: "danger",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBankAccountItem = (account: any) => {
    const key = account.externalBankId || account.id;
    const isSelected = selectedMethodId === key;

    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.paymentMethodItem,
          isSelected && styles.selectedPaymentMethod,
        ]}
        onPress={() => setSelectedMethodId(key)}
      >
        <View style={styles.paymentMethodIconContainer}>
          <BanknoteIcon size={24} color={Colors.primary} />
        </View>

        <View style={styles.paymentMethodInfo}>
          <Text style={styles.paymentMethodTitle}>
            {account.accountName ||
              `Account ****${
                (account.last4 || account.accountNumber?.slice(-4)) ?? ""
              }`}
          </Text>
          <Text style={styles.paymentMethodSubtitle}>
            {account.bankName} - {account.accountType}
          </Text>
          <Text style={styles.paymentMethodSubtitle}>
            ****{(account.last4 || account.accountNumber?.slice(-4)) ?? ""}
          </Text>
        </View>

        {isSelected && (
          <View style={styles.checkmarkContainer}>
            <Check size={20} color={Colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };
  const handleManagePayments = async () => {
    try {
      const uid = profile?.id || profile?.userId;
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
  return (
    <View style={styles.container}>
      <Header title={"Withdraw Funds"} />

      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
        <View style={styles.headerRight} />
      </View> */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(balance, currency)}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Withdrawal Amount</Text>

          <View style={styles.amountInputContainer}>
            <View style={styles.currencyContainer}>
              <Text style={styles.currencySymbol}>$</Text>
            </View>
            <Input
              placeholder="0.00"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              containerStyle={{ width: "83%", left: 10 }}
              style={styles.amountInput}
              inputStyle={{ paddingLeft: 10 }}
            />
          </View>

          <TouchableOpacity
            style={styles.maxButton}
            onPress={() => setAmount(balance.toString())}
          >
            <Text style={styles.maxButtonText}>Max Amount</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Withdraw To</Text>

          {bankAccounts && bankAccounts.length > 0 ? (
            bankAccounts.map((acc) => renderBankAccountItem(acc))
          ) : (
            <View style={styles.noMethodsContainer}>
              <Text style={styles.noMethodsText}>
                You don't have any bank accounts set up yet.
              </Text>
              <Button
                title="Add Bank Account"
                variant="outline"
                onPress={() =>
                  handleManagePayments()
                }
                style={styles.addMethodButton}
              />
            </View>
          )}

          <Button
            title={`Withdraw ${
              amount ? formatCurrency(parseFloat(amount) || 0, "USD") : ""
            }`}
            variant="primary"
            onPress={handleWithdraw}
            loading={loading}
            disabled={
              !amount ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > balance ||
              !selectedMethodId
            }
            style={styles.withdrawButton}
          />

          <Text style={styles.withdrawalNote}>
            Withdrawals typically take 1-3 business days to process depending on
            your payment method.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export { WithdrawScreen };

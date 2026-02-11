/**
 * AddPaymentMethod Screen
 * @format
 */

import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  CreditCard,
  BanknoteIcon,
  ArrowLeft,
  Check,
  CreditCardIcon,
} from "lucide-react-native";
import { showMessage } from "react-native-flash-message";

//Screens
import { Colors } from "@app/styles";
import { usePaymentStore } from "@app/store/paymentStore";
import { AddBankAccountRequest } from "@app/service/payment-service";
import { Button } from "@app/components/Button";
import { Input } from "@app/components/Input";
import { useThemedStyle } from "@app/styles";
import { getStyles } from "./styles";
import { useTranslation } from "react-i18next";
import Header from "@app/components/Header";

function AddPaymentMethodScreen() {
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const { addPaymentMethod, addBankAccount } = usePaymentStore();
  const { t } = useTranslation();

  const [methodType, setMethodType] = useState<"card" | "bank">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountType, setAccountType] = useState<"checking" | "savings">(
    "checking"
  );
  const [isDefault, setIsDefault] = useState(true);

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, "");
    // Limit to 16 digits
    const limited = cleaned.substring(0, 16);
    // Format with spaces every 4 digits
    const formatted = limited.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formatted;
  };

  const formatExpiryDate = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, "");
    // Limit to 4 digits
    const limited = cleaned.substring(0, 4);
    // Format as MM/YY
    if (limited.length > 2) {
      return `${limited.substring(0, 2)}/${limited.substring(2)}`;
    }
    return limited;
  };

  const handleCardNumberChange = (text: string) => {
    setCardNumber(formatCardNumber(text));
  };

  const handleExpiryDateChange = (text: string) => {
    setExpiryDate(formatExpiryDate(text));
  };
  const validateCardForm = () => {
    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) {
      showMessage({
        message: t("common.error"),
        description: t("errors.invalidCardNumber"),
        type: "danger",
      });
      return false;
    }

    if (!cardName) {
      showMessage({
        message: t("common.error"),
        description: t("errors.missingCardName"),
        type: "danger",
      });
      return false;
    }

    if (!expiryDate || expiryDate.length < 5) {
      showMessage({
        message: t("common.error"),
        description: t("errors.invalidExpiryDate"),
        type: "danger",
      });
      return false;
    }

    if (!cvv || cvv.length < 3) {
      showMessage({
        message: t("common.error"),
        description: t("errors.invalidCVV"),
        type: "danger",
      });
      return false;
    }

    return true;
  };

  const validateBankForm = () => {
    if (!bankName) {
      showMessage({
        message: t("common.error"),
        description: t("errors.missingBankName"),
        type: "danger",
      });
      return false;
    }

    if (!accountHolderName) {
      showMessage({
        message: t("common.error"),
        description: t("common.accountHolderNameRequired"),
        type: "danger",
      });
      return false;
    }

    if (!accountNumber || accountNumber.length < 8) {
      showMessage({
        message: t("common.error"),
        description: t("errors.invalidAccountNumber"),
        type: "danger",
      });
      return false;
    }

    if (!routingNumber || routingNumber.length < 9) {
      showMessage({
        message: t("common.error"),
        description: t("errors.invalidRoutingNumber"),
        type: "danger",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (methodType === "card" && !validateCardForm()) return;
    if (methodType === "bank" && !validateBankForm()) return;

    try {
      if (methodType === "card") {
        // Extract month and year from expiry date
        const [month, year] = expiryDate.split("/");

        // Determine card brand based on first digit
        const firstDigit = cardNumber.replace(/\s/g, "").charAt(0);
        let brand = "Unknown";
        let type = "unknown";

        if (firstDigit === "4") {
          brand = "Visa";
          type = "visa";
        } else if (firstDigit === "5") {
          brand = "Mastercard";
          type = "mastercard";
        } else if (firstDigit === "3") {
          brand = "American Express";
          type = "amex";
        } else if (firstDigit === "6") {
          brand = "Discover";
          type = "discover";
        }

        addPaymentMethod({
          id: `card-${Date.now()}`,
          type,
          brand,
          last4: cardNumber.replace(/\s/g, "").slice(-4),
          expMonth: month,
          expYear: year,
          isDefault,
        });

        showMessage({
          message: t("common.success"),
          description: t("success.added"),
          type: "success",
        });
        
        // Navigate back after a short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        // Call the addBankAccount API
        const bankAccountData: AddBankAccountRequest = {
          accountNumber,
          routingNumber,
          accountHolderName,
          accountType,
          bankName,
          country: "US", // Default to US for now
        };

        await addBankAccount(bankAccountData);

        showMessage({
          message: t("common.success"),
          description: t("common.bankAccountAddedSuccess"),
          type: "success",
        });
        
        // Navigate back after a short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (error) {
      console.error("Error adding payment method:", error);
      showMessage({
        message: t("common.error"),
        description: t("common.failedToAddPaymentMethod"),
        type: "danger",
      });
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t("profile.paymentMethods.addPaymentMethod")} />

      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('profile.paymentMethods.addPaymentMethod')}
        </Text>
        <View style={styles.headerRight} />
      </View> */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[
              styles.methodOption,
              methodType === "card" && styles.selectedMethodOption,
            ]}
            onPress={() => setMethodType("card")}
          >
            <CreditCardIcon
              size={24}
              color={
                methodType === "card" ? Colors.primary : Colors.textSecondary
              }
            />
            <Text
              style={[
                styles.methodOptionText,
                methodType === "card" && styles.selectedMethodOptionText,
              ]}
            >
              {t("profile.paymentMethods.cardOption")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodOption,
              methodType === "bank" && styles.selectedMethodOption,
            ]}
            onPress={() => setMethodType("bank")}
          >
            <BanknoteIcon
              size={24}
              color={
                methodType === "bank" ? Colors.primary : Colors.textSecondary
              }
            />
            <Text
              style={[
                styles.methodOptionText,
                methodType === "bank" && styles.selectedMethodOptionText,
              ]}
            >
              {t("profile.paymentMethods.bankOption")}
            </Text>
          </TouchableOpacity>
        </View>

        {methodType === "card" ? (
          <View style={styles.formContainer}>
            <Input
              label={t("profile.paymentMethods.cardNumber")}
              placeholder={t("profile.paymentMethods.placeholders.cardNumber")}
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              keyboardType="numeric"
              maxLength={19} // 16 digits + 3 spaces
              leftIcon={<CreditCard size={20} color={Colors.textSecondary} />}
            />

            <Input
              label={t("profile.paymentMethods.cardName")}
              placeholder={t("profile.paymentMethods.placeholders.cardName")}
              value={cardName}
              onChangeText={setCardName}
              autoCapitalize="words"
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Input
                  label={t("profile.paymentMethods.expiryDate")}
                  placeholder={t(
                    "profile.paymentMethods.placeholders.expiryDate"
                  )}
                  value={expiryDate}
                  onChangeText={handleExpiryDateChange}
                  keyboardType="numeric"
                  maxLength={5} // MM/YY
                />
              </View>

              <View style={styles.halfInput}>
                <Input
                  label={t("profile.paymentMethods.cvv")}
                  placeholder={t("profile.paymentMethods.placeholders.cvv")}
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Input
              label={t("profile.paymentMethods.bankName")}
              placeholder={t("profile.paymentMethods.placeholders.bankName")}
              value={bankName}
              onChangeText={setBankName}
              autoCapitalize="words"
            />

            <Input
              label="Account Holder Name"
              placeholder="Enter account holder name"
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              autoCapitalize="words"
            />

            <Input
              label={t("profile.paymentMethods.accountNumber")}
              placeholder={t(
                "profile.paymentMethods.placeholders.accountNumber"
              )}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
            />

            <Input
              label={t("profile.paymentMethods.routingNumber")}
              placeholder={t(
                "profile.paymentMethods.placeholders.routingNumber"
              )}
              value={routingNumber}
              onChangeText={setRoutingNumber}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>
              {t("profile.paymentMethods.accountType")}
            </Text>
            <View style={styles.accountTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.accountTypeOption,
                  accountType === "checking" && styles.selectedAccountType,
                ]}
                onPress={() => setAccountType("checking")}
              >
                <Text
                  style={[
                    styles.accountTypeText,
                    accountType === "checking" &&
                      styles.selectedAccountTypeText,
                  ]}
                >
                  {t("profile.paymentMethods.checking")}
                </Text>
                {accountType === "checking" && (
                  <Check size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.accountTypeOption,
                  accountType === "savings" && styles.selectedAccountType,
                ]}
                onPress={() => setAccountType("savings")}
              >
                <Text
                  style={[
                    styles.accountTypeText,
                    accountType === "savings" && styles.selectedAccountTypeText,
                  ]}
                >
                  {t("profile.paymentMethods.savings")}
                </Text>
                {accountType === "savings" && (
                  <Check size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.defaultOption}
          onPress={() => setIsDefault(!isDefault)}
        >
          <View style={[styles.checkbox, isDefault && styles.checkedCheckbox]}>
            {isDefault && <Check size={16} color={Colors.white} />}
          </View>
          <Text style={styles.defaultOptionText}>
            {t("profile.paymentMethods.setAsDefault")}
          </Text>
        </TouchableOpacity>

        <Button
          title={methodType == "card" ? t("profile.paymentMethods.addPaymentMethod") : t("profile.paymentMethods.addBankAccount")}
          variant="primary"
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </ScrollView>
    </View>
  );
}

export { AddPaymentMethodScreen };

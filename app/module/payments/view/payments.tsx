/**
 * Payments Screen
 * @format
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  DollarSign,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Wallet,
  BanknoteIcon,
  CreditCardIcon,
} from "lucide-react-native";
import LinearGradient from "react-native-linear-gradient";

//Screens
import { Colors } from "@app/styles";
import { useAuthStore } from "@app/store/authStore";
import { usePaymentStore } from "@app/store/paymentStore";
import { formatCurrency } from "@app/utils/formatters";
import { useThemedStyle } from "@app/styles";
import { Routes } from "../../../navigator";
import { getStyles } from "./paymentStyle";
import { useTranslation } from "react-i18next";

function PaymentsScreen() {
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { userRole, userProfile } = useAuthStore();
  const { balance, pendingBalance, paymentMethods, transactions } =
    usePaymentStore();

  const [activeTab, setActiveTab] = useState<"transactions" | "methods">(
    "transactions"
  );

  // Get recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

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
        return t("payment.status.completed");
      case "pending":
        return t("payment.status.pending");
      case "processing":
        return t("payment.status.processing");
      case "failed":
        return t("payment.status.failed");
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

    return (
      <TouchableOpacity
        key={transaction.id}
        style={styles.transactionItem}
        onPress={() =>
          navigation.navigate(Routes.TransactionDetailScreen, {
            transactionId: transaction?.id,
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
          <Text style={styles.transactionDate}>{transaction.date}</Text>
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
            {formatCurrency(transaction.amount, transaction.currency)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(transaction.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(transaction.status) },
              ]}
            >
              {getStatusText(transaction.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPaymentMethodItem = (method: any) => {
    const cardTypeIcon = () => {
      switch (method.type) {
        case "visa":
          return <CreditCardIcon size={24} color={Colors.primary} />;
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
        style={styles.paymentMethodItem}
        onPress={() =>
          navigation.navigate(Routes.PaymentMethodsScreen, { id: method.id })
        }
      >
        <View style={styles.paymentMethodIconContainer}>{cardTypeIcon()}</View>

        <View style={styles.paymentMethodInfo}>
          <Text style={styles.paymentMethodTitle}>
            {method.type === "bank"
              ? t("payment.methods.bankAccount")
              : `${method.brand} ****${method.last4}`}
          </Text>
          <Text style={styles.paymentMethodSubtitle}>
            {method.type === "bank"
              ? t("payment.methods.bankAccountDetails", {
                  bankName: method.bankName,
                  accountType: t(
                    `payment.methods.accountTypes.${method.accountType}`
                  ),
                })
              : t("payment.methods.cardExpires", {
                  month: method.expMonth,
                  year: method.expYear,
                })}
          </Text>
        </View>

        {method.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>
              {t("payment.methods.default")}
            </Text>
          </View>
        )}

        <ChevronRight size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.balanceCard}
      >
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>
            {t("payment.balance.available")}
          </Text>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate(Routes.PaymentHistoryScreen)}
          >
            <Clock size={16} color={Colors.white} style={styles.historyIcon} />
            <Text style={styles.historyText}>{t("payment.history")}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.balanceAmount}>
          {formatCurrency(balance, "USD")}
        </Text>

        {pendingBalance > 0 && (
          <View style={styles.pendingContainer}>
            <Text style={styles.pendingLabel}>
              {t("payment.balance.pending")}:{" "}
            </Text>
            <Text style={styles.pendingAmount}>
              {formatCurrency(pendingBalance, "USD")}
            </Text>
          </View>
        )}

        <View style={styles.balanceActions}>
          {userRole === "driver" && (
            <TouchableOpacity
              style={styles.balanceActionButton}
              onPress={() => navigation.navigate(Routes.WithdrawScreen)}
            >
              <Wallet
                size={20}
                color={Colors.white}
                style={styles.actionIcon}
              />
              <Text style={styles.actionText}>
                {t("payment.actions.withdraw")}
              </Text>
            </TouchableOpacity>
          )}

          {userRole === "merchant" && (
            <TouchableOpacity
              style={styles.balanceActionButton}
              onPress={() => navigation.navigate(Routes.DepositScreen)}
            >
              <Wallet
                size={20}
                color={Colors.white}
                style={styles.actionIcon}
              />
              <Text style={styles.actionText}>
                {t("payment.actions.addFunds")}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.balanceActionButton}
            onPress={() => navigation.navigate(Routes.PaymentMethodsScreen)}
          >
            <CreditCard
              size={20}
              color={Colors.white}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>
              {t("payment.actions.paymentMethods")}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.tabsContainer}>
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
            {t("payment.tabs.transactions")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "methods" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("methods")}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "methods" && styles.activeTabButtonText,
            ]}
          >
            {t("payment.tabs.methods")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "transactions" ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t("payment.recentTransactions")}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(Routes.PaymentHistoryScreen)}
              >
                <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
              </TouchableOpacity>
            </View>

            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) =>
                renderTransactionItem(transaction)
              )
            ) : (
              <View style={styles.emptyState}>
                <DollarSign size={40} color={Colors.textSecondary} />
                <Text style={styles.emptyStateTitle}>
                  {t("payment.noTransactions")}
                </Text>
                <Text style={styles.emptyStateDescription}>
                  {userRole === "driver"
                    ? t("payment.messages.driverNoTransactions")
                    : t("payment.messages.merchantNoTransactions")}
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t("payment.yourPaymentMethods")}
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  navigation.navigate(Routes.AddPaymentMethodScreen)
                }
              >
                <Plus size={16} color={Colors.white} />
                <Text style={styles.addButtonText}>{t("payment.addNew")}</Text>
              </TouchableOpacity>
            </View>

            {paymentMethods.length > 0 ? (
              paymentMethods.map((method) => renderPaymentMethodItem(method))
            ) : (
              <View style={styles.emptyState}>
                <CreditCard size={40} color={Colors.textSecondary} />
                <Text style={styles.emptyStateTitle}>
                  {t("payment.noPaymentMethods")}
                </Text>
                <Text style={styles.emptyStateDescription}>
                  {t("payment.messages.addPaymentMethod", {
                    action:
                      userRole === "driver"
                        ? t("payment.messages.receivePayments")
                        : t("payment.messages.payForJobs"),
                  })}
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() =>
                    navigation.navigate(Routes.AddPaymentMethodScreen)
                  }
                >
                  <Text style={styles.emptyStateButtonText}>
                    {t("payment.addPaymentMethod")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

export { PaymentsScreen };

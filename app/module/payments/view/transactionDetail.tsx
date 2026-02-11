/**
 * TransactionDetails Screen
 * @format
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  ArrowLeft,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  FileText,
  Download,
  Share2,
} from "lucide-react-native";

//Screens
import { Colors } from "@app/styles";
import { useAuthStore } from "@app/store/authStore";
import { usePaymentStore } from "@app/store/paymentStore";
import { formatCurrency } from "@app/utils/formatters";
import { Button } from "@app/components/Button";
import { useThemedStyle } from "@app/styles";
import { getStyles } from "./transDetailStyle";
import { Routes } from "@app/navigator";
import { useTranslation } from "react-i18next";
import Header from "@app/components/Header";

type RootStackParamList = {
  CallScreen: { id: string };
};
type CallScreenRouteProp = RouteProp<RootStackParamList, "CallScreen">;

function TransactionDetailScreen() {
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const route = useRoute();
  const { userRole } = useAuthStore();
  const { getTransactionById } = usePaymentStore();
  const { t } = useTranslation();

  const { transactionId, transaction: passedTx } = route.params as { transactionId?: string; transaction?: any };
  const transaction = passedTx || (transactionId ? getTransactionById(transactionId) : null);

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Header title={t("transaction.title")} />
        {/* <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("transaction.title")}</Text>
          <View style={styles.headerRight} />
        </View> */}
        <View style={styles.errorContainer}>
          <AlertCircle size={40} color={Colors.error} />
          <Text style={styles.errorTitle}>
            {t("transaction.errors.notFoundTitle")}
          </Text>
          <Text style={styles.errorDescription}>
            {t("transaction.errors.notFoundDescription")}
          </Text>
          <Button
            title={t("common.goBack")}
            variant="primary"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </View>
    );
  }

  const isIncoming =
    (userRole === "driver" && transaction.type === "payment") ||
    (userRole === "merchant" && transaction.type === "refund") ||
    transaction.type === "deposit";

  const isOutgoing =
    (userRole === "merchant" && transaction.type === "payment") ||
    (userRole === "driver" && transaction.type === "refund") ||
    transaction.type === "withdrawal";

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

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case "payment":
        return userRole === "driver"
          ? t("transaction.type.paymentReceived")
          : t("transaction.type.paymentSent");
      case "withdrawal":
        return t("transaction.type.withdrawal");
      case "deposit":
        return t("transaction.type.deposit");
      case "refund":
        return userRole === "driver"
          ? t("transaction.type.refundSent")
          : t("transaction.type.refundReceived");
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const renderTransactionIcon = (type: string, status: string) => {
    if (status === "failed") {
      return <AlertCircle size={32} color={Colors.error} />;
    }

    if (type === "payment") {
      return userRole === "driver" ? (
        <ArrowDownLeft size={32} color={Colors.success} />
      ) : (
        <ArrowUpRight size={32} color={Colors.error} />
      );
    } else if (type === "withdrawal") {
      return <ArrowUpRight size={32} color={Colors.error} />;
    } else if (type === "deposit") {
      return <ArrowDownLeft size={32} color={Colors.success} />;
    } else if (type === "refund") {
      return userRole === "driver" ? (
        <ArrowUpRight size={32} color={Colors.error} />
      ) : (
        <ArrowDownLeft size={32} color={Colors.success} />
      );
    }

    return <DollarSign size={32} color={Colors.primary} />;
  };

  const handleDownloadReceipt = () => {
    Alert.alert(
      t("transaction.receipt.downloadTitle"),
      t("transaction.receipt.downloadMessage")
    );
  };

  const handleShareReceipt = () => {
    Alert.alert(
      t("transaction.receipt.shareTitle"),
      t("transaction.receipt.shareMessage")
    );
  };

  return (
    <View style={styles.container}>
      <Header title={t("transaction.title")} />
      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}> {t("transaction.title")}</Text>
        <View style={styles.headerRight} />
      </View> */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.transactionHeader}>
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

          <Text style={styles.transactionType}>
            {getTransactionTypeText(transaction.type)}
          </Text>

          <Text
            style={[
              styles.transactionAmount,
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

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {t("transaction.details.id")}
            </Text>
            <Text style={styles.detailValue}>{transaction.id}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {" "}
              {t("transaction.details.dateTime")}
            </Text>
            <Text style={styles.detailValue}>
              {transaction.date} {transaction.time}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {" "}
              {t("transaction.details.description")}
            </Text>
            <Text style={styles.detailValue}>{transaction.description}</Text>
          </View>

          {transaction.jobId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {" "}
                {t("transaction.details.jobReference")}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  (navigation as any).navigate(Routes.JobsScreen, {
                    jobId: transaction.jobId,
                  })
                }
              >
                <Text style={styles.detailValueLink}>
                  {transaction.jobReference}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {transaction.paymentMethod && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {" "}
                {t("transaction.details.paymentMethod")}
              </Text>
              <View style={styles.paymentMethodContainer}>
                <CreditCard
                  size={16}
                  color={Colors.primary}
                  style={styles.paymentMethodIcon}
                />
                <Text style={styles.detailValue}>
                  {transaction.paymentMethod}
                </Text>
              </View>
            </View>
          )}

          {transaction.fee > 0 && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {" "}
                  {t("transaction.details.subtotal")}
                </Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(
                    transaction.amount - transaction.fee,
                    transaction.currency
                  )}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {t("transaction.details.platformFee")}
                </Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(transaction.fee, transaction.currency)}
                </Text>
              </View>
            </>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
            {t("transaction.details.total")}

              </Text>
            <Text style={[styles.detailValue, styles.totalValue]}>
              {formatCurrency(transaction.amount, transaction.currency)}
            </Text>
          </View>
        </View>

        {transaction.status === "completed" && (
          <View style={styles.receiptActions}>
            <TouchableOpacity
              style={styles.receiptAction}
              onPress={handleDownloadReceipt}
            >
              <Download
                size={20}
                color={Colors.primary}
                style={styles.receiptActionIcon}
              />
              <Text style={styles.receiptActionText}>
                {" "}
                {t("transaction.receipt.download")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.receiptAction}
              onPress={handleShareReceipt}
            >
              <Share2
                size={20}
                color={Colors.primary}
                style={styles.receiptActionIcon}
              />
              <Text style={styles.receiptActionText}>
                {t("transaction.receipt.share")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {transaction.status === "pending" && (
          <View style={styles.pendingMessage}>
            <Clock
              size={20}
              color={Colors.warning}
              style={styles.pendingIcon}
            />
            <Text style={styles.pendingText}>
              {t("transaction.messages.pending")}
            </Text>
          </View>
        )}

        {transaction.status === "failed" && (
          <View style={styles.failedMessage}>
            <AlertCircle
              size={20}
              color={Colors.error}
              style={styles.failedIcon}
            />
            <Text style={styles.failedText}>
              {t("transaction.messages.failed")}
            </Text>
          </View>
        )}

        {transaction.status === "failed" &&
          transaction.type === "payment" &&
          userRole === "merchant" && (
            <Button
              title="Try Again"
              variant="primary"
              // onPress={() => navigation.navigate(`/payments/retry/${transaction.id}`)}
              style={styles.retryButton}
            />
          )}

        <TouchableOpacity
          style={styles.supportButton}
          onPress={() => (navigation as any).navigate(Routes.TermsScreen)}
        >
          <Text style={styles.supportButtonText}>
            {t("transaction.support")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export { TransactionDetailScreen };

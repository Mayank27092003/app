/**
 * PaymentHistory Screen
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  Filter,
  Calendar,
  X,
} from 'lucide-react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import moment from 'moment';

//Screens
import { Colors } from '@app/styles';
import { useAuthStore } from '@app/store/authStore';
import { paymentService, Transaction } from '@app/service/payment-service';
import { formatCurrency } from '@app/utils/formatters';
import { useThemedStyle } from '@app/styles';
import { getStyles } from './styles';
import { Routes } from '../../../navigator';
import Header from '@app/components/Header';

function PaymentHistoryScreen() {
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const { userRole } = useAuthStore();

  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await paymentService.getTransactions(50, 0);
        if (mounted) setTransactions(data);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    if (typeFilter && transaction.type !== typeFilter) return false;
    if (statusFilter && transaction.status !== statusFilter) return false;
    if (dateFilter) {
      if (!transaction.date.includes(dateFilter)) return false;
    }
    return true;
  });

  const renderTransactionIcon = (type: string, status: string) => {
    if (status === 'failed') {
      return <AlertCircle size={20} color={Colors.error} />;
    }

    if (type === 'payment') {
      return userRole === 'driver' ? (
        <ArrowDownLeft size={20} color={Colors.success} />
      ) : (
        <ArrowUpRight size={20} color={Colors.error} />
      );
    } else if (type === 'withdrawal') {
      return <ArrowUpRight size={20} color={Colors.error} />;
    } else if (type === 'deposit') {
      return <ArrowDownLeft size={20} color={Colors.success} />;
    } else if (type === 'refund') {
      return userRole === 'driver' ? (
        <ArrowUpRight size={20} color={Colors.error} />
      ) : (
        <ArrowDownLeft size={20} color={Colors.success} />
      );
    }

    return <DollarSign size={20} color={Colors.primary} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'processing':
        return Colors.info;
      case 'failed':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncoming =
      (userRole === 'driver' && item.type === 'payment') ||
      (userRole === 'merchant' && item.type === 'refund') ||
      item.type === 'deposit';

    const isOutgoing =
      (userRole === 'merchant' && item.type === 'payment') ||
      (userRole === 'driver' && item.type === 'refund') ||
      item.type === 'withdrawal';

    const formattedDate = item.date ? moment(item.date).format('DD MMM YYYY, hh:mm A') : '';

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() =>
          (navigation as any).navigate(Routes.TransactionDetailScreen, {
            transaction: item,
            transactionId: item?.id,
          })
        }
      >
        <View
          style={[
            styles.transactionIconContainer,
            {
              backgroundColor:
                item.status === 'failed'
                  ? Colors.error + '20'
                  : Colors.primary + '20',
            },
          ]}
        >
          {renderTransactionIcon(item.type, item.status)}
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{item.description}</Text>
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
            {isIncoming ? '+' : isOutgoing ? '-' : ''}
            {formatCurrency(item.amount, item.currency)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterChip = (
    label: string,
    value: string,
    currentFilter: string | null,
    setFilter: (value: string | null) => void,
  ) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        currentFilter === value && styles.activeFilterChip,
      ]}
      onPress={() => setFilter(currentFilter === value ? null : value)}
    >
      <Text
        style={[
          styles.filterChipText,
          currentFilter === value && styles.activeFilterChipText,
        ]}
      >
        {label}
      </Text>
      {currentFilter === value && <X size={12} color={Colors.primary} />}
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Transaction Type</Text>
        <View style={styles.filterChips}>
          {renderFilterChip('Payment', 'payment', typeFilter, setTypeFilter)}
          {renderFilterChip(
            'Withdrawal',
            'withdrawal',
            typeFilter,
            setTypeFilter,
          )}
          {renderFilterChip('Deposit', 'deposit', typeFilter, setTypeFilter)}
          {renderFilterChip('Refund', 'refund', typeFilter, setTypeFilter)}
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Status</Text>
        <View style={styles.filterChips}>
          {renderFilterChip(
            'Completed',
            'completed',
            statusFilter,
            setStatusFilter,
          )}
          {renderFilterChip(
            'Pending',
            'pending',
            statusFilter,
            setStatusFilter,
          )}
          {renderFilterChip(
            'Processing',
            'processing',
            statusFilter,
            setStatusFilter,
          )}
          {renderFilterChip('Failed', 'failed', statusFilter, setStatusFilter)}
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Date</Text>
        <View style={styles.filterChips}>
          {renderFilterChip(
            'This Month',
            'Jun 2025',
            dateFilter,
            setDateFilter,
          )}
          {renderFilterChip(
            'Last Month',
            'May 2025',
            dateFilter,
            setDateFilter,
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.resetFiltersButton}
        onPress={() => {
          setTypeFilter(null);
          setStatusFilter(null);
          setDateFilter(null);
        }}
      >
        <Text style={styles.resetFiltersText}>Reset Filters</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <DollarSign size={40} color={Colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Transactions Found</Text>
      <Text style={styles.emptyStateDescription}>
        {typeFilter || statusFilter || dateFilter
          ? 'No transactions match your filters. Try adjusting your filters or clear them to see all transactions.'
          : "You don't have any transactions yet. They will appear here once you start using the platform."}
      </Text>
    </View>
  );

  const requestCameraPermission = async () => {
    const result = await request(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA
    );
    if (result === RESULTS.GRANTED) {
      // Permission granted
    }
  };

  return (
    <View style={styles.container}>
      <Header title={"Transaction History"} />

      {showFilters && renderFilters()}

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
  );
}

export { PaymentHistoryScreen };

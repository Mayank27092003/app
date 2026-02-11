/**
 * Deposit Screen
 * @format
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  BanknoteIcon,
  Check,
  CreditCardIcon,
} from 'lucide-react-native';

//Screens
import { Colors } from '@app/styles';
import { useAuthStore } from '@app/store/authStore';
import { usePaymentStore } from '@app/store/paymentStore';
import { formatCurrency } from '@app/utils/formatters';
import { Button } from '@app/components/Button';
import { Input } from '@app/components/Input';
import { useThemedStyle } from '@app/styles';
import { getStyles } from './styles';
import { Routes } from '../../../navigator';
import { useTranslation } from 'react-i18next';
import Header from '@app/components/Header';

function DepositScreen() {
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const { userProfile } = useAuthStore();
  const { balance, paymentMethods, bankAccounts, depositFunds, fetchBankAccounts } = usePaymentStore();
  const { t } = useTranslation();

  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Find default payment method
  const defaultMethod = paymentMethods.find(method => method.isDefault);

  // If there's a default method and no method is selected, select the default
  if (defaultMethod && !selectedMethodId) {
    setSelectedMethodId(defaultMethod.id);
  }

  const handleAmountChange = (text: string) => {
    // Remove all non-digits and non-decimal points
    const cleaned = text.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = cleaned.split('.');
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
      Alert.alert(t('common.error'), t('deposit.errors.invalidAmount'));
      return false;
    }

    if (!selectedMethodId) {
      Alert.alert(t('common.error'), t('deposit.errors.noPaymentMethod'));
      return false;
    }

    return true;
  };

  const handleDeposit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (selectedMethodId) {
        depositFunds(parseFloat(amount), selectedMethodId);

        Alert.alert(
          t('deposit.success.title'),
          t('deposit.success.message', {
            amount: formatCurrency(parseFloat(amount), 'USD')
          }),
          [{ 
            text: t('common.ok'), 
            onPress: () => navigation.navigate(Routes.PaymentScreen) 
          }],
        );
      }
    } catch (error) {
      console.error('Error processing deposit:', error);
      Alert.alert(
        t('common.error'), 
        t('deposit.errors.depositFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethodItem = (method: any) => {
    const isSelected = selectedMethodId === method.id;
    const cardTypeIcon = () => {
      switch (method.type) {
        case 'visa':
          return <CreditCardIcon size={24} color={Colors.primary} />;
        case 'mastercard':
          return <CreditCardIcon size={24} color={Colors.primary} />;
        case 'bank':
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
        onPress={() => setSelectedMethodId(method.id)}
      >
        <View style={styles.paymentMethodIconContainer}>{cardTypeIcon()}</View>

        <View style={styles.paymentMethodInfo}>
          <Text style={styles.paymentMethodTitle}>
            {method.type === 'bank'
              ? t('deposit.bankAccount')
              : `${method.brand} ****${method.last4}`}
          </Text>
          <Text style={styles.paymentMethodSubtitle}>
            {method.type === 'bank'
              ? t('deposit.bankAccountDetails', {
                  bankName: method.bankName,
                  accountType: t(`deposit.accountTypes.${method.accountType}`)
                })
              : t('deposit.cardExpires', {
                  month: method.expMonth,
                  year: method.expYear
                })}
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

  return (
    <View style={styles.container}>
      <Header title={t('deposit.title')} />
      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('deposit.title')}</Text>
        <View style={styles.headerRight} />
      </View> */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>{t('deposit.currentBalance')}</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(balance, 'USD')}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>{t('deposit.depositAmount')}</Text>

          <View style={styles.amountInputContainer}>
            <View style={styles.currencyContainer}>
              <Text style={styles.currencySymbol}>$</Text>
            </View>
            <Input
              placeholder={t('deposit.amountPlaceholder')}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              style={styles.amountInput}
            />
          </View>

          <View style={styles.quickAmounts}>
            <TouchableOpacity
              style={styles.quickAmountButton}
              onPress={() => setAmount('100')}
            >
              <Text style={styles.quickAmountText}>$100</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAmountButton}
              onPress={() => setAmount('500')}
            >
              <Text style={styles.quickAmountText}>$500</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAmountButton}
              onPress={() => setAmount('1000')}
            >
              <Text style={styles.quickAmountText}>$1000</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>{t('deposit.paymentMethod')}</Text>

          {paymentMethods.length > 0 ? (
            paymentMethods.map(method => renderPaymentMethodItem(method))
          ) : (
            <View style={styles.noMethodsContainer}>
              <Text style={styles.noMethodsText}>
                {t('deposit.noPaymentMethods')}
              </Text>
              <Button
                title={t('deposit.addPaymentMethod')}
                variant="outline"
                onPress={() => navigation.navigate(Routes.AddPaymentMethodScreen)}
                style={styles.addMethodButton}
              />
            </View>
          )}

          <Button
            title={t('deposit.addFundsButton', {
              amount: amount ? formatCurrency(parseFloat(amount) || 0, 'USD') : ''
            })}
            variant="primary"
            onPress={handleDeposit}
            loading={loading}
            disabled={!amount || parseFloat(amount) <= 0 || !selectedMethodId}
            style={styles.depositButton}
          />

          <Text style={styles.depositNote}>
            {t('deposit.depositNote')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export { DepositScreen };
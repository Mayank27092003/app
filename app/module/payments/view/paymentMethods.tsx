/**
 * PaymentMethod Screen
 * @format
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Plus,
  ChevronRight,
  Check,
  Trash2,
  BanknoteIcon,
  ArrowLeft,
  CreditCardIcon,
} from 'lucide-react-native';

//Screens
import { Colors } from '@app/styles';
import { usePaymentStore } from '@app/store/paymentStore';
import { Button } from '@app/components/Button';
import { useThemedStyle } from '@app/styles';
import { Routes } from '../../../navigator';
import { getStyles } from './styles';


function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyle(getStyles);
  const navigation = useNavigation();
  const { paymentMethods, setDefaultPaymentMethod, removePaymentMethod } =
    usePaymentStore();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const handleSetDefault = (methodId: string) => {
    setDefaultPaymentMethod(methodId);
    Alert.alert(t("common.success"), t("common.defaultPaymentMethodUpdated"));
  };

  const handleRemove = (methodId: string) => {
    Alert.alert(
      t("common.removePaymentMethod"),
      t("common.removePaymentMethodConfirm"),
      [
        { text: t("common.cancel"), style: 'cancel' },
        {
          text: t("common.remove"),
          style: 'destructive',
          onPress: () => {
            removePaymentMethod(methodId);
            Alert.alert(t("common.success"), t("common.paymentMethodRemoved"));
          },
        },
      ],
    );
  };

  const renderPaymentMethodItem = (method: any) => {
    const isSelected = selectedMethod === method.id;
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
        onPress={() => setSelectedMethod(isSelected ? null : method.id)}
      >
        <View style={styles.paymentMethodIconContainer}>{cardTypeIcon()}</View>

        <View style={styles.paymentMethodInfo}>
          <Text style={styles.paymentMethodTitle}>
            {method.type === 'bank'
              ? t("common.bankAccount")
              : `${method.brand} ****${method.last4}`}
          </Text>
          <Text style={styles.paymentMethodSubtitle}>
            {method.type === 'bank'
              ? `${method.bankName} - ${method.accountType}`
              : `${t("common.expires")} ${method.expMonth}/${method.expYear}`}
          </Text>
        </View>

        {method.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>{t("common.default")}</Text>
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
              onPress={() => handleRemove(method.id)}
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("common.paymentMethods")}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionDescription}>
          {t("common.managePaymentMethods")}
        </Text>

        {paymentMethods.length > 0 ? (
          paymentMethods.map(method => renderPaymentMethodItem(method))
        ) : (
          <View style={styles.emptyState}>
            <CreditCard size={40} color={Colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>{t("common.noPaymentMethods")}</Text>
            <Text style={styles.emptyStateDescription}>
              {t("common.addPaymentMethodDescription")}
            </Text>
          </View>
        )}

        <Button
          title={t("common.addNewPaymentMethod")}
          variant="primary"
          icon={<Plus size={20} color={Colors.white} />}
          onPress={() => navigation.navigate(Routes.AddPaymentMethodScreen)}
          style={styles.addButton}
        />
      </ScrollView>
    </View>
  );
}

export { PaymentMethodsScreen };

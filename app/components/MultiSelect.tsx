/**
 * MultiSelect Component
 * @format
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ChevronDown, X, Check } from 'lucide-react-native';
import { Colors, ScaledSheet } from '@app/styles';

interface Option {
  id: string | number;
  label: string;
  value: string;
}

interface MultiSelectProps {
  label: string;
  placeholder: string;
  options: Option[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  leftIcon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  placeholder,
  options,
  selectedValues,
  onSelectionChange,
  leftIcon,
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionToggle = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];

    onSelectionChange(newSelection);
  };

  const removeSelected = (value: string) => {
    const newSelection = selectedValues.filter(v => v !== value);
    onSelectionChange(newSelection);
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    }
    return `${selectedValues.length} items selected`;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.dropdownButton,
          error && styles.errorBorder,
          disabled && styles.disabled,
        ]}
        onPress={toggleDropdown}
        disabled={disabled}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <View style={styles.buttonContent}>
          <Text
            style={[
              styles.buttonText,
              selectedValues.length === 0 && styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {getDisplayText()}
          </Text>

          {!!selectedValues.length && (
            <View style={styles.selectedCount}>
              <Text style={styles.selectedCountText}>{selectedValues.length}</Text>
            </View>
          )}
        </View>

        <ChevronDown
          size={20}
          color={Colors.gray400}
          style={[styles.chevron, isOpen && styles.chevronRotated]}
        />
      </TouchableOpacity>

      {/* Selected Items Display */}
      {!!selectedValues.length && (
        <View style={styles.selectedItemsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedValues.map((value) => {
              const option = options.find(opt => opt.value === value);
              return (
                <View key={value} style={styles.selectedItem}>
                  <Text style={styles.selectedItemText}>
                    {option?.label || value}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeSelected(value)}
                    style={styles.removeButton}
                  >
                    <X size={14} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdownContainer}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select {label}</Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <X size={20} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedValues.includes(item.value) && styles.selectedOptionItem
                  ]}
                  onPress={() => handleOptionToggle(item.value)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionText,
                      selectedValues.includes(item.value) && styles.selectedOptionText
                    ]}>
                      {item.label}
                    </Text>
                    {selectedValues.includes(item.value) && (
                      <View style={styles.checkContainer}>
                        <Check size={18} color={Colors.primary} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.backgroundCard,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 52,
  },
  errorBorder: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: Colors.gray600,
  },
  leftIcon: {
    marginRight: 12,
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
    fontWeight: '500',
  },
  placeholderText: {
    color: Colors.gray400,
    fontWeight: '400',
  },
  selectedCount: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  selectedCountText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 12,
    transition: 'transform 0.2s ease',
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  selectedItemsContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedItemText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  removeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 4,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  dropdownContainer: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    backgroundColor: Colors.backgroundCard,
  },
  dropdownTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  closeButton: {
    backgroundColor: Colors.gray100,
    borderRadius: 20,
    padding: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    maxHeight: 400,
    paddingBottom: 20,
  },
  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gray100,
    backgroundColor: Colors.backgroundCard,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  selectedOptionItem: {
    backgroundColor: Colors.primary + '08',
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkContainer: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 4,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 
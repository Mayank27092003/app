/**
 * Address Autocomplete Component
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
} from 'react-native';
import { MapPin, X } from 'lucide-react-native';
import { Colors } from '@app/styles';
import { useLocationStore } from '@app/store/locationStore';
import {
  getPlacePredictions,
  getPlaceDetails,
  parseAddressComponents,
  PlacePrediction,
  ParsedAddress
} from '@app/utils';

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onAddressSelect: (address: ParsedAddress) => void;
  onTextChange?: (text: string) => void;
  error?: string;
  disabled?: boolean;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  placeholder,
  value,
  onAddressSelect,
  onTextChange,
  error,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [sessionToken, setSessionToken] = useState(() =>
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  );
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Get current location from location store
  const { currentLocation } = useLocationStore();

  useEffect(() => {
    setInputText(value);
  }, [value]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    onTextChange?.(text);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce API calls
    debounceRef.current = setTimeout(async () => {
      if (text.length >= 2) {
        try {
          console.log('🔍 AddressAutocomplete: Fetching predictions for:', text);
          console.log('🔍 AddressAutocomplete: Current location:', currentLocation);

          const results = await getPlacePredictions(
            text,
            sessionToken,
            currentLocation ? {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude
            } : undefined
          );

          console.log('🔍 AddressAutocomplete: Received predictions:', results.length);
          setPredictions(results);
          setShowPredictions(true);
        } catch (error) {
          console.error('Error fetching predictions:', error);
          setPredictions([]);
        }
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    }, 300);
  };

  const handlePredictionSelect = async (prediction: PlacePrediction) => {
    setInputText(prediction.description);
    setShowPredictions(false);

    try {
      const placeDetails = await getPlaceDetails(prediction.place_id, sessionToken);
      if (placeDetails) {
        const parsedAddress = parseAddressComponents(placeDetails);
        onAddressSelect(parsedAddress);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const handleClear = () => {
    setInputText('');
    setPredictions([]);
    setShowPredictions(false);
    onTextChange?.('');
    setSessionToken(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  };

  const renderPrediction = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => handlePredictionSelect(item)}
    >
      <MapPin size={16} color={Colors.gray400} style={styles.predictionIcon} />
      <View style={styles.predictionText}>
        <Text style={styles.predictionMainText}>
          {item.structured_formatting.main_text}
        </Text>
        <Text style={styles.predictionSecondaryText}>
          {item.structured_formatting.secondary_text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputContainer, error && styles.inputError]}>
        <MapPin size={20} color={Colors.gray400} style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          value={inputText}
          onChangeText={handleTextChange}
          editable={!disabled}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {!!inputText.length && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={16} color={Colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}

      {/* Predictions Modal */}
      <Modal
        visible={Boolean(showPredictions && predictions.length > 0)}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPredictions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPredictions(false)}
        >
          <View style={styles.predictionsContainer}>
            <FlatList
              data={predictions}
              renderItem={renderPrediction}
              keyExtractor={(item) => item.place_id}
              style={styles.predictionsList}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundCard,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  clearButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  predictionsContainer: {
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 300,
    paddingTop: 16,
  },
  predictionsList: {
    maxHeight: 284,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  predictionIcon: {
    marginRight: 12,
  },
  predictionText: {
    flex: 1,
  },
  predictionMainText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  predictionSecondaryText: {
    fontSize: 14,
    color: Colors.gray400,
    marginTop: 2,
  },
});

/**
 * Address Dropdown Component
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
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

interface AddressDropdownProps {
  label: string;
  placeholder: string;
  value: string;
  onAddressSelect: (address: ParsedAddress) => void;
  onTextChange?: (text: string) => void;
  error?: string;
  disabled?: boolean;
}

export const AddressDropdown: React.FC<AddressDropdownProps> = ({
  label,
  placeholder,
  value,
  onAddressSelect,
  onTextChange,
  error,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState(value || '');
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
       if (text && text.length >= 2) {
         try {
           console.log('🔍 AddressDropdown: Fetching predictions for:', text);
           console.log('🔍 AddressDropdown: Current location:', currentLocation);
           
           const results = await getPlacePredictions(
             text, 
             sessionToken, 
             currentLocation ? {
               latitude: currentLocation.latitude,
               longitude: currentLocation.longitude
             } : undefined
           );
           
           console.log('🔍 AddressDropdown: Received predictions:', results ? results.length : 0);
           setPredictions(results || []);
           setShowPredictions(true);
         } catch (error) {
           console.error('Error fetching predictions:', error);
           setPredictions([]);
           setShowPredictions(false);
         }
       } else {
         setPredictions([]);
         setShowPredictions(false);
       }
    }, 300);
  };

  const handlePredictionSelect = async (prediction: PlacePrediction) => {
    console.log('🔍 AddressDropdown - prediction selected:', prediction);
    setInputText(prediction.description);
    setShowPredictions(false);

    try {
      console.log('🔍 AddressDropdown - fetching place details for place_id:', prediction.place_id);
      const placeDetails = await getPlaceDetails(prediction.place_id, sessionToken);
      console.log('🔍 AddressDropdown - place details received:', placeDetails);
      
      if (placeDetails) {
        const parsedAddress = parseAddressComponents(placeDetails);
        console.log('🔍 AddressDropdown - parsed address:', parsedAddress);
        onAddressSelect(parsedAddress);
      } else {
        console.error('🔍 AddressDropdown - no place details received');
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

  const renderPrediction = ({ item, index }: { item: PlacePrediction; index: number }) => (
    <TouchableOpacity
      style={[
        styles.predictionItem,
        predictions && index === predictions.length - 1 && styles.lastPredictionItem
      ]}
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
          placeholderTextColor={Colors.gray400}
          placeholder={placeholder}
          value={inputText}
          onChangeText={handleTextChange}
          editable={!disabled}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {Boolean(inputText && inputText.length > 0) && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={16} color={Colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}

      {/* Dropdown Predictions */}
      {Boolean(showPredictions && predictions && predictions.length > 0) && (
        <View style={styles.dropdownContainer}>
          <FlatList
            data={predictions || []}
            renderItem={renderPrediction}
            keyExtractor={(item) => item.place_id}
            style={styles.predictionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1000,
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
    borderRadius: 12,
    backgroundColor: Colors.gray200,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1001,
    maxHeight: 200,
  },
  predictionsList: {
    maxHeight: 200,
    backgroundColor: Colors.backgroundCard,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  lastPredictionItem: {
    borderBottomWidth: 0,
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

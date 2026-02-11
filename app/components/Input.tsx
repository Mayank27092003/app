/**
 * Input Screen
 * @format
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

//Screens
import { Colors, ScaledSheet } from '@app/styles';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  errorStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  isPassword = false,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const renderPasswordIcon = () => {
    if (!isPassword) return rightIcon;

    return (
      <TouchableOpacity
        onPress={togglePasswordVisibility}
        style={styles.iconContainer}
      >
        {isPasswordVisible ? (
          <EyeOff size={20} color={Colors.textSecondary} />
        ) : (
          <Eye size={20} color={Colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          error ? styles.inputError : null,
          inputStyle,
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? { paddingLeft: 8 } : null,
            rightIcon || isPassword ? { paddingRight: 8 } : null,
          ]}
          placeholderTextColor={Colors.textSecondary}
          secureTextEntry={isPassword ? !isPasswordVisible : secureTextEntry}
          {...props}
        />
        {(rightIcon || isPassword) && renderPasswordIcon()}
      </View>
      {error && <Text style={[styles.errorText, errorStyle]}>{error}</Text>}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    marginBottom: '16@ms',
    width: '100%',
  },
  label: {
    fontSize: '14@ms',
    fontWeight: '500',
    marginBottom: '6@ms',
    color: Colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: '8@ms',
    backgroundColor: Colors.backgroundCard,
  },
  input: {
    flex: 1,
    paddingVertical: '12@ms',
    paddingHorizontal: '16@ms',
    fontSize: '16@ms',
    color: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  iconContainer: {
    paddingHorizontal: '12@ms',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: '12@ms',
    marginTop: '4@ms',
  },
});

/**
 * Button Screen
 * @format
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';

//Screens
import { Colors, ScaledSheet } from '@app/styles';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  ...props
}) => {
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...(fullWidth && styles.fullWidth),
    };

    if (disabled) {
      return {
        ...baseStyle,
        ...styles.disabled,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          ...styles.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          ...styles.secondary,
        };
      case 'outline':
        return {
          ...baseStyle,
          ...styles.outline,
        };
      case 'ghost':
        return {
          ...baseStyle,
          ...styles.ghost,
        };
      case 'danger':
        return {
          ...baseStyle,
          ...styles.danger,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = styles.text;

    if (disabled) {
      return {
        ...baseStyle,
        ...styles.disabledText,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          ...styles.primaryText,
        };
      case 'secondary':
        return {
          ...baseStyle,
          ...styles.secondaryText,
        };
      case 'outline':
        return {
          ...baseStyle,
          ...styles.outlineText,
        };
      case 'ghost':
        return {
          ...baseStyle,
          ...styles.ghostText,
        };
      case 'danger':
        return {
          ...baseStyle,
          ...styles.dangerText,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'outline' || variant === 'ghost'
              ? Colors.primary
              : Colors.white
          }
          size="small"
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[getTextStyles(), textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = ScaledSheet.create({
  button: {
    paddingVertical: '12@ms',
    paddingHorizontal: '18@ms',
    borderRadius: '8@ms',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: '8@ms',
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error,
  },
  disabled: {
    backgroundColor: Colors.gray700,
    borderColor: Colors.gray700,
  },
  text: {
    fontSize: '16@ms',
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.white,
  },
  outlineText: {
    color: Colors.primary,
  },
  ghostText: {
    color: Colors.primary,
  },
  dangerText: {
    color: Colors.white,
  },
  disabledText: {
    color: Colors.gray500,
  },
});

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { theme } from '../../theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...styles[`${variant}Button`],
      ...styles[`${size}Button`],
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    if (isDisabled) {
      baseStyle.opacity = 0.5;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    return {
      ...styles.text,
      ...styles[`${variant}Text`],
      ...styles[`${size}Text`],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? theme.colors.white : theme.colors.primary[600]}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },

  // Variants
  primaryButton: {
    backgroundColor: theme.colors.primary[600],
  },
  secondaryButton: {
    backgroundColor: theme.colors.gray[200],
  },
  outlineButton: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 1,
    borderColor: theme.colors.primary[600],
  },
  ghostButton: {
    backgroundColor: theme.colors.transparent,
  },

  // Sizes
  smButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  mdButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  lgButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },

  // Text styles
  text: {
    fontWeight: theme.fontWeight.semibold,
  },
  primaryText: {
    color: theme.colors.white,
  },
  secondaryText: {
    color: theme.colors.gray[900],
  },
  outlineText: {
    color: theme.colors.primary[600],
  },
  ghostText: {
    color: theme.colors.primary[600],
  },

  // Text sizes
  smText: {
    fontSize: theme.fontSize.sm,
  },
  mdText: {
    fontSize: theme.fontSize.md,
  },
  lgText: {
    fontSize: theme.fontSize.lg,
  },
});

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../theme';
import { ApplicationStatus } from '../../types';

interface StatusBadgeProps {
  status: ApplicationStatus;
  style?: ViewStyle;
}

const statusConfig: Record<
  ApplicationStatus,
  { label: string; backgroundColor: string; color: string }
> = {
  pending: {
    label: 'Pending',
    backgroundColor: theme.colors.warning.light,
    color: theme.colors.warning.dark,
  },
  reviewing: {
    label: 'Reviewing',
    backgroundColor: theme.colors.info.light,
    color: theme.colors.info.dark,
  },
  interview: {
    label: 'Interview',
    backgroundColor: theme.colors.primary[100],
    color: theme.colors.primary[700],
  },
  approved: {
    label: 'Approved',
    backgroundColor: theme.colors.success.light,
    color: theme.colors.success.dark,
  },
  rejected: {
    label: 'Rejected',
    backgroundColor: theme.colors.error.light,
    color: theme.colors.error.dark,
  },
  withdrawn: {
    label: 'Withdrawn',
    backgroundColor: theme.colors.gray[200],
    color: theme.colors.gray[700],
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const config = statusConfig[status];

  const badgeStyle: ViewStyle = {
    ...styles.badge,
    backgroundColor: config.backgroundColor,
  };

  const textStyle: TextStyle = {
    ...styles.text,
    color: config.color,
  };

  return (
    <View style={[badgeStyle, style]}>
      <Text style={textStyle}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
  },
});

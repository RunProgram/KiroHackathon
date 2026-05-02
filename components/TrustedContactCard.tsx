/**
 * TrustedContactCard — displays saved contact name and relationship with an Edit button.
 *
 * Requirements: 6.6
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { TrustedContact } from '../types';

interface TrustedContactCardProps {
  contact: TrustedContact;
  onEdit: () => void;
}

export function TrustedContactCard({
  contact,
  onEdit,
}: TrustedContactCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.relationship}>{contact.relationship}</Text>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Edit contact ${contact.name}`}
      >
        <Text style={styles.editLabel}>Edit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: Colors.darkText,
    fontSize: Typography.bodySize,
    fontWeight: '600',
  },
  relationship: {
    color: Colors.grayText,
    fontSize: Typography.captionSize,
  },
  editButton: {
    minHeight: Typography.minTouchTarget,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.softBlue,
  },
  editLabel: {
    color: Colors.softBlue,
    fontSize: Typography.bodySize,
    fontWeight: '600',
  },
});

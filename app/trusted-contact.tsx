/**
 * TrustedContactScreen — Trusted Contact Setup screen.
 *
 * Requirements: 6.1, 6.2, 6.4, 6.5, 6.6
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryActionButton } from '../components/PrimaryActionButton';
import { SecondaryActionButton } from '../components/SecondaryActionButton';
import { TrustedContactCard } from '../components/TrustedContactCard';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { Typography } from '../constants/typography';
import { useTrustedContact } from '../hooks/useTrustedContact';

export default function TrustedContactScreen(): React.JSX.Element {
  const router = useRouter();
  const { contact, saveContact } = useTrustedContact();

  const [name, setName] = useState<string>(contact?.name ?? '');
  const [phoneNumber, setPhoneNumber] = useState<string>(
    contact?.phoneNumber ?? ''
  );
  const [relationship, setRelationship] = useState<string>(
    contact?.relationship ?? ''
  );
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(!contact);

  async function handleSave(): Promise<void> {
    setPhoneError(null);
    try {
      await saveContact({ name, phoneNumber, relationship });
      Alert.alert(Strings.messages.contactSaved);
      router.back();
    } catch (err) {
      if (err instanceof Error) {
        setPhoneError(err.message);
      } else {
        setPhoneError(Strings.messages.invalidPhoneNumber);
      }
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>
          {Strings.screenTitles.trustedContact}
        </Text>

        {contact && (
          <View style={styles.cardContainer}>
            <TrustedContactCard
              contact={contact}
              onEdit={() => setIsEditing(true)}
            />
          </View>
        )}

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={Colors.grayText}
            accessibilityLabel="Contact name"
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, phoneError ? styles.inputError : null]}
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              if (phoneError) setPhoneError(null);
            }}
            placeholder="+1 555 123 4567"
            placeholderTextColor={Colors.grayText}
            accessibilityLabel="Phone number"
            keyboardType="phone-pad"
            returnKeyType="next"
          />
          {phoneError && (
            <Text style={styles.errorText} accessibilityRole="alert">
              {phoneError}
            </Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Relationship</Text>
          <TextInput
            style={styles.input}
            value={relationship}
            onChangeText={setRelationship}
            placeholder="e.g. Daughter, Son, Caregiver"
            placeholderTextColor={Colors.grayText}
            accessibilityLabel="Relationship to contact"
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryActionButton
            label={Strings.buttons.save}
            onPress={handleSave}
            accessibilityLabel="Save trusted contact"
          />
          <SecondaryActionButton
            label={Strings.buttons.cancel}
            onPress={() => router.back()}
            accessibilityLabel="Cancel and go back"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    padding: 24,
    gap: 20,
  },
  screenTitle: {
    fontSize: Typography.headingSize,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 4,
  },
  cardContainer: {
    marginBottom: 4,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: Typography.bodySize,
    fontWeight: '600',
    color: Colors.darkText,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.softBlue,
    padding: 16,
    fontSize: Typography.bodySize,
    color: Colors.darkText,
    minHeight: Typography.minTouchTarget,
  },
  inputError: {
    borderColor: Colors.red,
  },
  errorText: {
    fontSize: Typography.captionSize,
    color: Colors.red,
    marginTop: 4,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
});

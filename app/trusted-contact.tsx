/**
 * Trusted Contact Setup screen.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../constants/colors';
import { useTrustedContact } from '../hooks/useTrustedContact';

export default function TrustedContactScreen(): React.JSX.Element {
  const router = useRouter();
  const { contact, saveContact } = useTrustedContact();

  const [name, setName] = useState(contact?.name ?? '');
  const [phone, setPhone] = useState(contact?.phoneNumber ?? '');
  const [relationship, setRelationship] = useState(contact?.relationship ?? '');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    setPhoneError(null);
    try {
      await saveContact({ name, phoneNumber: phone, relationship });
      Alert.alert('✅ Saved!', `${name} has been saved as your trusted contact.`);
      router.back();
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'Invalid phone number.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>👤 Trusted Contact</Text>
        <Text style={styles.subtitle}>
          Save someone you trust — a family member or caregiver — so you can call them instantly from the app.
        </Text>

        {contact && (
          <View style={styles.currentContact}>
            <Text style={styles.currentContactLabel}>Currently saved:</Text>
            <Text style={styles.currentContactName}>{contact.name}</Text>
            <Text style={styles.currentContactSub}>
              {contact.relationship} · {contact.phoneNumber}
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Their name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Sarah"
              placeholderTextColor={Colors.grayText}
              autoCapitalize="words"
              returnKeyType="next"
              accessibilityLabel="Contact name"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Their phone number</Text>
            <TextInput
              style={[styles.input, phoneError ? styles.inputError : null]}
              value={phone}
              onChangeText={(t) => { setPhone(t); setPhoneError(null); }}
              placeholder="+1 555 123 4567"
              placeholderTextColor={Colors.grayText}
              keyboardType="phone-pad"
              returnKeyType="next"
              accessibilityLabel="Phone number"
            />
            {phoneError && (
              <Text style={styles.errorText}>{phoneError}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Your relationship</Text>
            <TextInput
              style={styles.input}
              value={relationship}
              onChangeText={setRelationship}
              placeholder="e.g. Daughter, Son, Caregiver"
              placeholderTextColor={Colors.grayText}
              autoCapitalize="words"
              returnKeyType="done"
              accessibilityLabel="Relationship"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, (!name || !phone) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!name || !phone}
          accessibilityRole="button"
        >
          <Text style={styles.saveBtnText}>💾 Save contact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 20,
  },
  back: { paddingVertical: 4 },
  backText: { fontSize: 18, color: Colors.softBlue, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.darkText },
  subtitle: { fontSize: 18, color: Colors.grayText, lineHeight: 26 },
  currentContact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.green,
    gap: 4,
  },
  currentContactLabel: { fontSize: 14, color: Colors.grayText },
  currentContactName: { fontSize: 22, fontWeight: '700', color: Colors.darkText },
  currentContactSub: { fontSize: 16, color: Colors.grayText },
  form: { gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 18, fontWeight: '600', color: Colors.darkText },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.softBlue,
    padding: 16,
    fontSize: 20,
    color: Colors.darkText,
    minHeight: 72,
  },
  inputError: { borderColor: Colors.red },
  errorText: { fontSize: 16, color: Colors.red },
  saveBtn: {
    backgroundColor: Colors.deepNavy,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    minHeight: 72,
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { fontSize: 18, color: Colors.grayText },
});

/**
 * Trusted Contact Setup screen — manage up to 3 trusted contacts.
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
import { MAX_TRUSTED_CONTACTS, useTrustedContact } from '../hooks/useTrustedContact';
import { TrustedContact } from '../types';

const RELATIONSHIPS = [
  { label: 'Daughter', value: 'Daughter' },
  { label: 'Son', value: 'Son' },
  { label: 'Father', value: 'Father' },
  { label: 'Mother', value: 'Mother' },
  { label: 'Grandchild', value: 'Grandchild' },
  { label: 'Spouse / Partner', value: 'Spouse' },
  { label: 'Caregiver', value: 'Caregiver' },
  { label: 'Family Member', value: 'Family Member' },
  { label: 'Friend', value: 'Friend' },
  { label: 'Doctor / Nurse', value: 'Doctor' },
  { label: 'Other…', value: 'Other' },
];

type FormState = {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  customRelationship: string;
};

const EMPTY_FORM: FormState = {
  id: '',
  name: '',
  phone: '',
  relationship: '',
  customRelationship: '',
};

export default function TrustedContactScreen(): React.JSX.Element {
  const router = useRouter();
  const { contacts, saveContact, removeContact } = useTrustedContact();

  const [form, setForm] = useState<FormState | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  function openAdd(): void {
    setForm({ ...EMPTY_FORM, id: Date.now().toString() });
    setPhoneError(null);
  }

  function openEdit(contact: TrustedContact): void {
    setForm({
      id: contact.id,
      name: contact.name,
      phone: contact.phoneNumber,
      relationship: RELATIONSHIPS.find((r) => r.value === contact.relationship)
        ? contact.relationship
        : 'Other',
      customRelationship: RELATIONSHIPS.find((r) => r.value === contact.relationship)
        ? ''
        : contact.relationship,
    });
    setPhoneError(null);
  }

  function closeForm(): void {
    setForm(null);
    setPhoneError(null);
  }

  async function handleSave(): Promise<void> {
    if (!form) return;
    setPhoneError(null);
    const finalRelationship = form.relationship === 'Other'
      ? form.customRelationship.trim()
      : form.relationship;

    if (!finalRelationship) {
      Alert.alert('Please select a relationship');
      return;
    }

    try {
      await saveContact({
        id: form.id,
        name: form.name.trim(),
        phoneNumber: form.phone.trim(),
        relationship: finalRelationship,
      });
      Alert.alert('Saved!', `${form.name} has been saved.`);
      closeForm();
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'Invalid phone number.');
    }
  }

  function handleRemove(contact: TrustedContact): void {
    Alert.alert(
      `Remove ${contact.name}?`,
      'They will no longer appear as a trusted contact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeContact(contact.id),
        },
      ],
    );
  }

  const canAdd = contacts.length < MAX_TRUSTED_CONTACTS;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Pinned top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.back} onPress={() => { closeForm(); router.back(); }}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Trusted Contacts</Text>
        <Text style={styles.subtitle}>
          Save up to {MAX_TRUSTED_CONTACTS} people you trust. They'll be available to call instantly from the app.
        </Text>

        {/* Existing contacts list */}
        {contacts.length > 0 && (
          <View style={styles.contactsList}>
            {contacts.map((c, i) => (
              <View key={c.id} style={styles.contactCard}>
                <View style={styles.contactCardLeft}>
                  <Text style={styles.contactCardNumber}>{i + 1}</Text>
                  <View>
                    <Text style={styles.contactCardName}>{c.name}</Text>
                    <Text style={styles.contactCardSub}>{c.relationship} · {c.phoneNumber}</Text>
                  </View>
                </View>
                <View style={styles.contactCardActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEdit(c)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(c)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add button */}
        {canAdd && form === null && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={openAdd}
            accessibilityRole="button"
          >
            <Text style={styles.addBtnText}>＋ Add trusted contact</Text>
            <Text style={styles.addBtnSub}>{contacts.length}/{MAX_TRUSTED_CONTACTS} saved</Text>
          </TouchableOpacity>
        )}

        {/* Form */}
        {form !== null && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {contacts.find((c) => c.id === form.id) ? 'Edit contact' : 'Add new contact'}
            </Text>

            {/* Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Their name</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="e.g. Sarah"
                placeholderTextColor={Colors.grayText}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Phone */}
            <View style={styles.field}>
              <Text style={styles.label}>Their phone number</Text>
              <TextInput
                style={[styles.input, phoneError ? styles.inputError : null]}
                value={form.phone}
                onChangeText={(v) => { setForm({ ...form, phone: v }); setPhoneError(null); }}
                placeholder="+1 555 123 4567"
                placeholderTextColor={Colors.grayText}
                keyboardType="phone-pad"
                returnKeyType="done"
                contextMenuHidden={false}
                selectTextOnFocus
              />
              {phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
            </View>

            {/* Relationship */}
            <View style={styles.field}>
              <Text style={styles.label}>Who are they to you?</Text>
              <View style={styles.chipGrid}>
                {RELATIONSHIPS.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[
                      styles.chip,
                      form.relationship === r.value && styles.chipSelected,
                    ]}
                    onPress={() => setForm({ ...form, relationship: r.value })}
                    accessibilityRole="button"
                  >
                    <Text style={[
                      styles.chipText,
                      form.relationship === r.value && styles.chipTextSelected,
                    ]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {form.relationship === 'Other' && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  value={form.customRelationship}
                  onChangeText={(v) => setForm({ ...form, customRelationship: v })}
                  placeholder="Describe the relationship…"
                  placeholderTextColor={Colors.grayText}
                  autoCapitalize="words"
                />
              )}
            </View>

            {/* Form actions */}
            <TouchableOpacity
              style={[styles.saveBtn, (!form.name || !form.phone) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!form.name || !form.phone}
              accessibilityRole="button"
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelFormBtn} onPress={closeForm}>
              <Text style={styles.cancelFormBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: Colors.cream,
  },
  back: { paddingVertical: 8 },
  backText: { fontSize: 18, color: Colors.softBlue, fontWeight: '600' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 20,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.darkText },
  subtitle: { fontSize: 17, color: Colors.grayText, lineHeight: 24 },

  contactsList: { gap: 10 },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  contactCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  contactCardNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.deepNavy,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
    overflow: 'hidden',
  },
  contactCardName: { fontSize: 18, fontWeight: '700', color: Colors.darkText },
  contactCardSub: { fontSize: 14, color: Colors.grayText, marginTop: 2 },
  contactCardActions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    backgroundColor: Colors.softBlue,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  removeBtn: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.red },

  addBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.softBlue,
    borderStyle: 'dashed',
    gap: 4,
  },
  addBtnText: { fontSize: 20, fontWeight: '700', color: Colors.softBlue },
  addBtnSub: { fontSize: 14, color: Colors.grayText },

  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: { fontSize: 20, fontWeight: '700', color: Colors.darkText },
  field: { gap: 8 },
  label: { fontSize: 17, fontWeight: '600', color: Colors.darkText },
  input: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.softBlue,
    padding: 14,
    fontSize: 18,
    color: Colors.darkText,
    minHeight: 56,
  },
  inputError: { borderColor: Colors.red },
  errorText: { fontSize: 15, color: Colors.red },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: Colors.cream,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.softBlue,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: Colors.deepNavy, borderColor: Colors.deepNavy },
  chipText: { fontSize: 15, color: Colors.softBlue, fontWeight: '600' },
  chipTextSelected: { color: '#FFFFFF' },
  saveBtn: {
    backgroundColor: Colors.deepNavy,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  cancelFormBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelFormBtnText: { fontSize: 17, color: Colors.grayText },
});

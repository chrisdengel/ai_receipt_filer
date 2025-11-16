import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView, Switch } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LogOut, Moon, CreditCard, HelpCircle, Lock } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [darkMode, setDarkMode] = useState(isDark);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const containerBgColor = isDark ? '#0a0a0a' : '#f5f5f5';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryTextColor = isDark ? '#b0b0b0' : '#666666';
  const cardBgColor = isDark ? '#2a2a2a' : '#ffffff';

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: containerBgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Settings</Text>
      </View>

      <View style={[styles.section, { marginTop: 24 }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Account</Text>

        <View style={[styles.settingItem, { backgroundColor: cardBgColor }]}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Email</Text>
            <Text style={[styles.settingValue, { color: secondaryTextColor }]}>{user?.email}</Text>
          </View>
        </View>

        <View style={[styles.settingItem, { backgroundColor: cardBgColor }]}>
          <View style={styles.settingContent}>
            <View style={styles.settingHeader}>
              <Moon size={20} color={secondaryTextColor} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: textColor }]}>Dark Mode</Text>
            </View>
          </View>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Billing</Text>

        <TouchableOpacity style={[styles.settingItem, { backgroundColor: cardBgColor }]}>
          <View style={styles.settingContent}>
            <View style={styles.settingHeader}>
              <CreditCard size={20} color="#0066cc" style={styles.settingIcon} />
              <View>
                <Text style={[styles.settingLabel, { color: textColor }]}>Payment Methods</Text>
                <Text style={[styles.settingValue, { color: secondaryTextColor }]}>Manage cards & accounts</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, { backgroundColor: cardBgColor }]}>
          <View style={styles.settingContent}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingIcon}>💳</Text>
              <View>
                <Text style={[styles.settingLabel, { color: textColor }]}>Subscription</Text>
                <Text style={[styles.settingValue, { color: secondaryTextColor }]}>Free Plan - Upgrade</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Support</Text>

        <TouchableOpacity style={[styles.settingItem, { backgroundColor: cardBgColor }]}>
          <View style={styles.settingContent}>
            <View style={styles.settingHeader}>
              <HelpCircle size={20} color={secondaryTextColor} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: textColor }]}>Help & Support</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, { backgroundColor: cardBgColor }]}>
          <View style={styles.settingContent}>
            <View style={styles.settingHeader}>
              <Lock size={20} color={secondaryTextColor} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: textColor }]}>Privacy Policy</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.dangerButton, { marginTop: 32 }]}
        onPress={handleSignOut}>
        <LogOut size={20} color="#ef4444" />
        <Text style={styles.dangerButtonText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: secondaryTextColor, marginTop: 32, marginBottom: 40 }]}>
        Version 1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  section: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    marginBottom: 12,
    opacity: 0.7,
  },
  settingItem: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  dangerButton: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});

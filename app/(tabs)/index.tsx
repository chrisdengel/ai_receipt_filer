import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, AlertCircle, DollarSign } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [stats, setStats] = useState({ receipts: 0, bills: 0, upcomingBills: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const [receiptsResult, billsResult, upcomingResult, amountResult] = await Promise.all([
          supabase
            .from('receipts')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id),
          supabase
            .from('bills')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .is('paid_at', null),
          supabase
            .from('bills')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .is('paid_at', null)
            .gt('due_date', new Date().toISOString().split('T')[0]),
          supabase
            .from('receipts')
            .select('amount')
            .eq('user_id', user.id),
        ]);

        const total = (amountResult.data || []).reduce((sum, receipt) => sum + (receipt.amount || 0), 0);

        setStats({
          receipts: receiptsResult.count || 0,
          bills: billsResult.count || 0,
          upcomingBills: upcomingResult.count || 0,
          totalSpent: total,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const containerBgColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryTextColor = isDark ? '#b0b0b0' : '#666666';
  const cardBgColor = isDark ? '#2a2a2a' : '#f9f9f9';

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5' }]}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: textColor }]}>Welcome back!</Text>
        <Text style={[styles.date, { color: secondaryTextColor }]}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: cardBgColor }]}>
          <View style={styles.statIcon}>
            <TrendingUp size={24} color="#10b981" />
          </View>
          <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Receipts Filed</Text>
          <Text style={[styles.statValue, { color: textColor }]}>{stats.receipts}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: cardBgColor }]}>
          <View style={styles.statIcon}>
            <AlertCircle size={24} color="#f59e0b" />
          </View>
          <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Bills to Pay</Text>
          <Text style={[styles.statValue, { color: textColor }]}>{stats.bills}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: cardBgColor }]}>
          <View style={styles.statIcon}>
            <DollarSign size={24} color="#0066cc" />
          </View>
          <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Total Spent</Text>
          <Text style={[styles.statValue, { color: textColor }]}>${stats.totalSpent.toFixed(2)}</Text>
        </View>
      </View>

      <View style={[styles.section, { marginTop: 32 }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Actions</Text>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#0066cc' }]}>
          <Text style={styles.actionButtonText}>Upload Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#2a2a2a' : '#e8e8e8' }]}>
          <Text style={[styles.actionButtonText, { color: textColor }]}>View Bills</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { marginBottom: 40 }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Payment Methods</Text>
        <TouchableOpacity style={[styles.methodCard, { backgroundColor: cardBgColor }]}>
          <Text style={[styles.methodName, { color: textColor }]}>Add Payment Method</Text>
          <Text style={[styles.methodDesc, { color: secondaryTextColor }]}>+ Add Card or Bank Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    marginBottom: 32,
    marginTop: 12,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statIcon: {
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  methodCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  methodName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});

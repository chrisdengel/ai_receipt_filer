import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, FlatList } from 'react-native';
import { FileText, Filter, Download } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Document {
  id: string;
  vendor_name: string;
  amount: number;
  document_date: string;
  document_type: string;
}

export default function DocumentsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('id, vendor_name, amount, document_date, document_type')
          .eq('user_id', user.id)
          .order('document_date', { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  const containerBgColor = isDark ? '#0a0a0a' : '#f5f5f5';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryTextColor = isDark ? '#b0b0b0' : '#666666';
  const cardBgColor = isDark ? '#2a2a2a' : '#ffffff';

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity style={[styles.documentCard, { backgroundColor: cardBgColor }]}>
      <View style={styles.documentIcon}>
        <FileText size={24} color="#0066cc" />
      </View>
      <View style={styles.documentInfo}>
        <Text style={[styles.vendorName, { color: textColor }]}>{item.vendor_name || 'Unnamed'}</Text>
        <Text style={[styles.documentDate, { color: secondaryTextColor }]}>
          {new Date(item.document_date).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.documentAmount}>
        <Text style={[styles.amount, { color: textColor }]}>${item.amount?.toFixed(2) || '0.00'}</Text>
        <Text style={[styles.type, { color: secondaryTextColor }]}>{item.document_type}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: containerBgColor }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: textColor }]}>Documents</Text>
          <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
            {documents.length} filed
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: cardBgColor }]}>
            <Filter size={20} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: cardBgColor }]}>
            <Download size={20} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading documents...</Text>
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={48} color={secondaryTextColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>No documents yet</Text>
          <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
            Start by capturing your first receipt
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 40,
  },
  documentCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  documentAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  type: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});

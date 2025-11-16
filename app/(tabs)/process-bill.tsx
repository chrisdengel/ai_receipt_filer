import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Check, X, Crop } from 'lucide-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function ProcessBillScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [processedImage, setProcessedImage] = useState<string>(imageUri);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState('');

  const containerBgColor = isDark ? '#0a0a0a' : '#f5f5f5';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryTextColor = isDark ? '#b0b0b0' : '#666666';
  const cardBgColor = isDark ? '#2a2a2a' : '#ffffff';

  useEffect(() => {
    extractTextFromImage();
  }, []);

  const extractTextFromImage = async () => {
    setExtracting(true);

    try {
      const response = await fetch(processedImage);
      const blob = await response.blob();

      const reader = new FileReader();
      reader.readAsDataURL(blob);

      await new Promise((resolve) => {
        reader.onloadend = resolve;
      });

      const base64Data = (reader.result as string).split(',')[1];

      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ocr-extract`;
      const apiKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      const ocrResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: `data:image/jpeg;base64,${base64Data}`,
        }),
      });

      const result = await ocrResponse.json();

      if (result.success && result.data) {
        setVendorName(result.data.vendor_name || '');
        if (result.data.amount) {
          setAmount(result.data.amount.toString());
        }
        if (result.data.due_date) {
          setDueDate(result.data.due_date);
        }
      } else {
        Alert.alert('OCR Notice', 'Could not extract text automatically. Please enter manually.');
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      Alert.alert('OCR Error', 'Failed to extract text. Please enter manually.');
    } finally {
      setExtracting(false);
    }
  };

  const handleCropImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProcessedImage(result.assets[0].uri);

        setVendorName('');
        setAmount('');
        setDueDate('');

        await extractTextFromImage();
      }
    } catch (error) {
      console.error('Crop error:', error);
      Alert.alert('Error', 'Failed to edit image');
    }
  };

  const uploadImageToStorage = async (uri: string, userId: string) => {
    const fileName = `${userId}/${Date.now()}.jpg`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
      });

    if (error) throw error;
    return data.path;
  };

  const handleSave = async () => {
    if (!vendorName || !amount || !dueDate) {
      Alert.alert('Missing Information', 'Please fill in vendor name, amount, and due date');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setLoading(true);

    try {
      const filePath = await uploadImageToStorage(processedImage, user.id);

      const { data: documentData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: `bill_${Date.now()}.jpg`,
          file_path: filePath,
          document_type: 'bill',
          status: 'filed',
          vendor_name: vendorName,
          amount: parseFloat(amount),
          document_date: dueDate,
          notes: notes || null,
        })
        .select()
        .single();

      if (docError) throw docError;

      const { error: billError } = await supabase
        .from('bills')
        .insert({
          user_id: user.id,
          document_id: documentData.id,
          vendor_name: vendorName,
          amount: parseFloat(amount),
          due_date: dueDate,
          paid_at: isPaid ? new Date().toISOString() : null,
          notes: notes || null,
        });

      if (billError) throw billError;

      Alert.alert('Success', 'Bill saved successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/documents'),
        },
      ]);
    } catch (error) {
      console.error('Error saving bill:', error);
      Alert.alert('Error', 'Failed to save bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: containerBgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Process Bill</Text>
        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
          Review and confirm the details
        </Text>
      </View>

      <View style={[styles.imageContainer, { backgroundColor: cardBgColor }]}>
        <Image source={{ uri: processedImage }} style={styles.image} />
        <TouchableOpacity
          style={styles.cropButton}
          onPress={handleCropImage}
        >
          <Crop size={16} color="#ffffff" />
          <Text style={styles.cropButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {extracting && (
        <View style={[styles.extractingBanner, { backgroundColor: cardBgColor }]}>
          <ActivityIndicator size="small" color="#0066cc" />
          <Text style={[styles.extractingText, { color: textColor }]}>
            Extracting text from image...
          </Text>
        </View>
      )}

      <View style={[styles.form, { backgroundColor: cardBgColor }]}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Vendor Name *</Text>
          <TextInput
            style={[styles.input, { color: textColor, backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            placeholder="Who is this bill from?"
            placeholderTextColor={secondaryTextColor}
            value={vendorName}
            onChangeText={setVendorName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Amount *</Text>
          <TextInput
            style={[styles.input, { color: textColor, backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            placeholder="0.00"
            placeholderTextColor={secondaryTextColor}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Due Date *</Text>
          <TextInput
            style={[styles.input, { color: textColor, backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={secondaryTextColor}
            value={dueDate}
            onChangeText={setDueDate}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Has this been paid?</Text>
          <View style={styles.paymentStatusButtons}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                isPaid && styles.statusButtonActive,
                { borderColor: isDark ? '#444' : '#e0e0e0' }
              ]}
              onPress={() => setIsPaid(true)}
            >
              <Check size={16} color={isPaid ? '#ffffff' : textColor} />
              <Text style={[styles.statusButtonText, { color: isPaid ? '#ffffff' : textColor }]}>
                Yes, Paid
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusButton,
                !isPaid && styles.statusButtonActive,
                { borderColor: isDark ? '#444' : '#e0e0e0' }
              ]}
              onPress={() => setIsPaid(false)}
            >
              <X size={16} color={!isPaid ? '#ffffff' : textColor} />
              <Text style={[styles.statusButtonText, { color: !isPaid ? '#ffffff' : textColor }]}>
                Not Paid
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textArea, { color: textColor, backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            placeholder="Add any additional notes..."
            placeholderTextColor={secondaryTextColor}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: isDark ? '#444' : '#e0e0e0' }]}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={[styles.cancelButtonText, { color: textColor }]}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Bill</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  imageContainer: {
    borderRadius: 12,
    height: 200,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  cropButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cropButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  extractingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  extractingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  form: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  paymentStatusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  statusButtonActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  statusButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

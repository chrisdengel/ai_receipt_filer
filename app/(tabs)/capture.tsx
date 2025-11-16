import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView, Image, Alert } from 'react-native';
import { Camera, Upload, Image as ImageIcon, X, ArrowRight } from 'lucide-react-native';
import { useState, useRef } from 'react';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function CaptureScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const containerBgColor = isDark ? '#0a0a0a' : '#f5f5f5';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryTextColor = isDark ? '#b0b0b0' : '#666666';
  const cardBgColor = isDark ? '#2a2a2a' : '#ffffff';

  const handleTakePhoto = async () => {
    if (!cameraPermission) {
      return;
    }

    if (!cameraPermission.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }
    }

    setShowCamera(true);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) {
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        setCapturedImage(photo.uri);
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const handleChooseFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const handleClearImage = () => {
    setCapturedImage(null);
  };

  const handleProcessBill = () => {
    if (!capturedImage) {
      Alert.alert('No Image', 'Please capture or select an image first');
      return;
    }
    router.push({
      pathname: '/(tabs)/process-bill',
      params: { imageUri: capturedImage },
    });
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeCameraButton}
              onPress={() => setShowCamera(false)}
            >
              <X size={24} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: containerBgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Capture Document</Text>
        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>Take a photo of your receipt or bill</Text>
      </View>

      {capturedImage ? (
        <View style={[styles.imagePreviewContainer, { backgroundColor: cardBgColor }]}>
          <Image source={{ uri: capturedImage }} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.clearImageButton}
            onPress={handleClearImage}
          >
            <X size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.cameraPlaceholder, { backgroundColor: cardBgColor }]}>
          <Camera size={48} color={secondaryTextColor} />
          <Text style={[styles.placeholderText, { color: secondaryTextColor }]}>No Image Captured</Text>
          <Text style={[styles.placeholderSubtext, { color: secondaryTextColor }]}>
            Use one of the options below
          </Text>
        </View>
      )}

      {capturedImage && (
        <TouchableOpacity
          style={[styles.processButton, { backgroundColor: '#10b981' }]}
          onPress={handleProcessBill}
        >
          <Text style={styles.processButtonText}>Process Bill</Text>
          <ArrowRight size={20} color="#ffffff" />
        </TouchableOpacity>
      )}

      <View style={styles.options}>
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: '#0066cc' }]}
          onPress={handleTakePhoto}
        >
          <Camera size={20} color="#ffffff" />
          <Text style={styles.optionButtonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: isDark ? '#2a2a2a' : '#e8e8e8' }]}
          onPress={handleChooseFromGallery}
        >
          <ImageIcon size={20} color={textColor} />
          <Text style={[styles.optionButtonText, { color: textColor }]}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoBox, { backgroundColor: cardBgColor }]}>
        <Text style={[styles.infoTitle, { color: textColor }]}>Tips for Best Results</Text>
        <Text style={[styles.infoText, { color: secondaryTextColor }]}>• Ensure good lighting</Text>
        <Text style={[styles.infoText, { color: secondaryTextColor }]}>• Place document flat and straight</Text>
        <Text style={[styles.infoText, { color: secondaryTextColor }]}>• Include all important details</Text>
        <Text style={[styles.infoText, { color: secondaryTextColor }]}>• Avoid shadows or glare</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
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
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  closeCameraButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  cameraPlaceholder: {
    borderRadius: 12,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  imagePreviewContainer: {
    borderRadius: 12,
    height: 300,
    marginBottom: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  clearImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  processButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  processButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  options: {
    gap: 12,
    marginBottom: 32,
  },
  optionButton: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  optionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  infoBox: {
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
    lineHeight: 18,
  },
});

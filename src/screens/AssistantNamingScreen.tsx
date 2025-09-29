import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../types';
import { setUser } from '../store/slices/userSlice';
import ApiService from '../services/api';

const { height } = Dimensions.get('window');

type AssistantNamingNavigationProp = StackNavigationProp<RootStackParamList, 'AssistantNaming'>;
type AssistantNamingRouteProp = RouteProp<RootStackParamList, 'AssistantNaming'>;

const suggestedNames = [
  'Alex', 'Sam', 'Jordan', 'Casey', 'Riley',
  'Taylor', 'Morgan', 'Avery', 'Quinn', 'Sage'
];

const AssistantNamingScreen: React.FC = () => {
  const navigation = useNavigation<AssistantNamingNavigationProp>();
  const route = useRoute<AssistantNamingRouteProp>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { phone, email, userDetails, user, token, passwordGenerated } = route.params;

  const [assistantName, setAssistantName] = useState('');
  const [userName, setUserName] = useState(userDetails?.preferredName || '');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Fade animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Focus input after animation
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 300);
  }, []);

  const isValidSetup = () => {
    const trimmedName = assistantName.trim();
    return trimmedName.length >= 2 && trimmedName.length <= 20;
  };

  const handleSuggestedName = (name: string) => {
    setAssistantName(name);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to select a profile image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    if (!isValidSetup()) {
      return;
    }

    setLoading(true);
    try {
      let imageToUpload: string | undefined = undefined;

      // Use image URI directly for efficient multipart upload
      if (profileImage) {
        console.log('📸 Using image URI for direct multipart upload...');
        imageToUpload = profileImage; // Pass URI directly - no Base64 conversion needed!
        console.log('✅ Image ready for efficient upload');
      }

      // Save assistant configuration to backend
      const response = await ApiService.setupAssistant(
        assistantName.trim(),
        imageToUpload
      );

      if (response.success && user) {
        // Use the real user account created during registration
        const updatedUser = {
          ...user,
          assistantName: response.data.assistantName, // Use backend response
          assistantProfileImage: response.data.assistantProfileImage, // Use backend response
        };

        dispatch(setUser(updatedUser));

        // Navigate to assistant gender selection (don't complete onboarding yet)
        navigation.navigate('AssistantGender');
      } else {
        Alert.alert('Error', response.error || 'Failed to setup assistant. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to complete setup:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to setup assistant. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Background gradient flare */}
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(0, 0, 0, 0.8)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />


      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Setup Assistant</Text>
          <Text style={styles.subtitle}>
            Name & customize your AI
          </Text>
        </View>

        <Animated.View
          style={[
            styles.slidingContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
            keyboardVerticalOffset={-50}
          >
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.step}>Setup</Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                style={[
                  styles.content,
                  { opacity: fadeAnim },
                ]}
              >
                <Text style={styles.instructionText}>Add a profile photo (optional)</Text>
                <Text style={styles.descriptionText}>
                  Choose a photo to represent your AI assistant
                </Text>

                {/* Profile Photo Selector */}
                <View style={styles.profilePhotoContainer}>
                  <TouchableOpacity
                    style={styles.profilePhotoButton}
                    onPress={pickImage}
                    activeOpacity={0.8}
                  >
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.profileImage} />
                    ) : (
                      <View style={styles.profilePlaceholder}>
                        <Ionicons name="camera" size={32} color="rgba(255, 255, 255, 0.5)" />
                        <Text style={styles.profilePlaceholderText}>Add Photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.nameInstructionText}>Give your assistant a name</Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    ref={nameInputRef}
                    style={styles.nameInput}
                    placeholder="Enter assistant name"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={assistantName}
                    onChangeText={setAssistantName}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleComplete}
                    maxLength={15}
                    selectionColor="#3396D3"
                  />
                </View>

                <View style={styles.previewContainer}>
                  <View style={styles.previewBox}>
                    <View style={styles.previewHeader}>
                      {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.previewImage} />
                      ) : (
                        <View style={styles.previewImagePlaceholder}>
                          <Ionicons name="person" size={20} color="rgba(255, 255, 255, 0.5)" />
                        </View>
                      )}
                      <View style={styles.previewInfo}>
                        <Text style={styles.previewName}>
                          {assistantName || '[Assistant Name]'}
                        </Text>
                        <Text style={styles.previewPersonality}>
                          Personal AI Assistant
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.previewLabel}>Example usage:</Text>
                    <Text style={styles.previewText}>
                      "Hey {assistantName || '[name]'}, what's the weather like today?"
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </ScrollView>

            <Animated.View
              style={[
                styles.footer,
                { opacity: fadeAnim },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !isValidSetup() && styles.disabledButton,
                ]}
                onPress={handleComplete}
                disabled={!isValidSetup() || loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : (
                  <Text style={[
                    styles.continueButtonText,
                    !isValidSetup() && styles.disabledButtonText,
                  ]}>
                    Complete Setup
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.finalText}>
                You're almost ready to start your Yo! experience!
              </Text>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientFlare: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    paddingHorizontal: 30,
    paddingTop: 15,
    paddingBottom: 10,
    alignItems: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 20,
  },
  slidingContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  keyboardAvoid: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  step: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
  },
  instructionText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  descriptionText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  inputContainer: {
    marginBottom: 32,
  },
  nameInput: {
    height: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profilePhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  profilePlaceholder: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    fontWeight: '500',
  },
  nameInstructionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewBox: {
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.15)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  previewImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  previewPersonality: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  previewLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  previewText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
    fontWeight: '400',
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 25,
  },
  continueButton: {
    height: 65,
    backgroundColor: '#3396D3',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  disabledButtonText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  finalText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '400',
  },
});

export default AssistantNamingScreen;
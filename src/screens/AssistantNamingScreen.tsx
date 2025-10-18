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
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../types';
import { setUser } from '../store/slices/userSlice';
import { RootState } from '../store';
import ApiService from '../services/api';
import ProgressBar from '../components/ProgressBar';

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
  const { phone, email, userDetails, user: userFromParams, token, passwordGenerated } = route.params || {};

  // Get user from Redux store (fallback to params for backward compatibility)
  const userFromRedux = useSelector((state: RootState) => state.user?.user);
  const user = userFromRedux || userFromParams;

  // Get theme from Redux store
  const theme = useSelector((state: RootState) => state.theme.theme);

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
      console.log('🚀 [AssistantNaming] Starting assistant setup...');
      console.log('🚀 [AssistantNaming] User from Redux:', !!userFromRedux);
      console.log('🚀 [AssistantNaming] User from Params:', !!userFromParams);
      console.log('🚀 [AssistantNaming] Final user:', !!user);

      let imageToUpload: string | undefined = undefined;

      // Use image URI directly for efficient multipart upload
      if (profileImage) {
        console.log('📸 Using image URI for direct multipart upload...');
        imageToUpload = profileImage; // Pass URI directly - no Base64 conversion needed!
        console.log('✅ Image ready for efficient upload');
      }

      // Save assistant configuration to backend
      console.log('📡 [AssistantNaming] Calling setupAssistant API...');
      const response = await ApiService.setupAssistant(
        assistantName.trim(),
        imageToUpload
      );

      console.log('📡 [AssistantNaming] API Response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error
      });

      if (response.success && user) {
        console.log('✅ [AssistantNaming] Setup successful, updating user...');
        // Use the real user account created during registration
        const updatedUser = {
          ...user,
          assistantName: response.data.assistantName, // Use backend response
          assistantProfileImage: response.data.assistantProfileImage, // Use backend response
        };

        dispatch(setUser(updatedUser));

        // Navigate to UserProfileSetup where PA asks "What should I call you?"
        console.log('✅ [AssistantNaming] Navigating to UserProfileSetup...');
        navigation.navigate('UserProfileSetup', {
          assistantName: response.data.assistantName,
          assistantProfileImage: response.data.assistantProfileImage,
          showAsConversation: true,
        } as any);
      } else {
        console.error('❌ [AssistantNaming] Setup failed:', {
          responseSuccess: response.success,
          hasUser: !!user,
          error: response.error
        });
        Alert.alert('Error', response.error || 'Failed to setup assistant. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ [AssistantNaming] Exception during setup:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to setup assistant. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSkip = () => {
    // Skip assistant setup and go directly to Main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as any }],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background gradient flare */}


      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar - Fixed on black background */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 15) + 10, backgroundColor: theme.background }]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.step, { color: theme.text }]}>Setup Your Assistant</Text>
          <TouchableOpacity
            style={[styles.photoButton, { backgroundColor: `${theme.accent}10`, borderColor: `${theme.accent}30` }]}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.topPhotoImage} />
            ) : (
              <View style={styles.photoButtonPlaceholder}>
                <Ionicons name="camera" size={20} color={theme.accent} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <ProgressBar currentStep={1} totalSteps={4} />

        <Animated.View
          style={[
            styles.slidingContainer,
            { backgroundColor: theme.surface, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
            keyboardVerticalOffset={-50}
          >

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
                <Text style={[styles.instructionText, { color: theme.text }]}>Name your AI assistant</Text>

                <View style={[styles.inputContainer, { backgroundColor: `${theme.text}08`, borderColor: theme.border }]}>
                  <MaterialIcons name="assistant" size={24} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    ref={nameInputRef}
                    style={[styles.nameInput, { color: theme.text }]}
                    placeholder="e.g., Alex, Sam, Jordan"
                    placeholderTextColor={theme.textTertiary}
                    value={assistantName}
                    onChangeText={setAssistantName}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleComplete}
                    maxLength={15}
                    selectionColor={theme.accent}
                  />
                </View>

                {assistantName.length > 0 && (
                  <View style={styles.previewContainer}>
                    <View style={[styles.previewBox, { backgroundColor: `${theme.accent}08`, borderColor: `${theme.accent}30` }]}>
                      <View style={styles.previewHeader}>
                        {profileImage ? (
                          <Image source={{ uri: profileImage }} style={styles.previewImage} />
                        ) : (
                          <View style={[styles.previewImagePlaceholder, { backgroundColor: `${theme.accent}15` }]}>
                            <Ionicons name="sparkles" size={20} color={theme.accent} />
                          </View>
                        )}
                        <View style={styles.previewInfo}>
                          <Text style={[styles.previewName, { color: theme.text }]}>
                            {assistantName}
                          </Text>
                          <Text style={[styles.previewPersonality, { color: theme.textSecondary }]}>
                            Your AI Assistant
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.previewText, { color: theme.textSecondary }]}>
                        "Hey {assistantName}, what's on my schedule?"
                      </Text>
                    </View>
                  </View>
                )}
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
                  { backgroundColor: theme.accent },
                  !isValidSetup() && styles.disabledButton,
                ]}
                onPress={handleComplete}
                disabled={!isValidSetup() || loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color={theme.background} size="large" />
                ) : (
                  <Text style={[
                    styles.continueButtonText,
                    { color: theme.background },
                    !isValidSetup() && [styles.disabledButtonText, { color: theme.textTertiary }],
                  ]}>
                    Continue
                  </Text>
                )}
              </TouchableOpacity>
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
  slidingContainer: {
    flex: 1,
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  step: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  photoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButtonPlaceholder: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topPhotoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  instructionText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 18,
    height: 60,
    marginBottom: 28,
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  nameInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
  },
  previewContainer: {
    marginTop: 8,
  },
  previewBox: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  previewImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  previewPersonality: {
    fontSize: 13,
  },
  previewText: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  continueButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  disabledButtonText: {},
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 247, 245, 0.5)',
  },
});

export default AssistantNamingScreen;
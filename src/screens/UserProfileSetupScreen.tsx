import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import ApiService from '../services/api';
import { setUser } from '../store/slices/userSlice';
import ProgressBar from '../components/ProgressBar';

const { width, height } = Dimensions.get('window');

type UserProfileSetupNavigationProp = StackNavigationProp<RootStackParamList, 'UserProfileSetup'>;
type UserProfileSetupRouteProp = RouteProp<RootStackParamList, 'UserProfileSetup'>;

const UserProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<UserProfileSetupNavigationProp>();
  const route = useRoute<UserProfileSetupRouteProp>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const currentUser = useSelector((state: RootState) => state.user.user);
  const theme = useSelector((state: RootState) => state.theme.theme);

  // Get assistant name from route params or Redux
  const assistantName = (route.params as any)?.assistantName || currentUser?.assistantName || 'Your Assistant';
  const assistantImage = (route.params as any)?.assistantProfileImage || currentUser?.assistantProfileImage;
  const showAsConversation = (route.params as any)?.showAsConversation || false;

  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [title, setTitle] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name');
      return;
    }

    if (!preferredName.trim()) {
      Alert.alert('Required Field', 'Please enter your preferred name');
      return;
    }

    setSaving(true);
    try {
      // Update user profile with name details
      const updatedUser = await ApiService.updateUserProfile({
        fullName: fullName.trim(),
        preferredName: preferredName.trim(),
        title: title.trim() || undefined,
      });

      // Update Redux store
      dispatch(setUser(updatedUser));

      console.log('✅ User profile updated successfully');

      // Navigate to AssistantGender where PA asks "How should I sound?"
      navigation.navigate('AssistantGender', {
        assistantName,
        assistantProfileImage: assistantImage,
      } as any);
    } catch (error: any) {
      console.error('❌ Failed to update user profile:', error);
      Alert.alert(
        'Update Failed',
        'Unable to save your profile. Please try again.',
        [
          { text: 'Retry', onPress: handleContinue },
          { text: 'Skip for now', onPress: () => navigation.navigate('AssistantNaming', route.params || {}) },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = fullName.trim().length > 0 && preferredName.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar - Fixed on black background */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 15) + 10, backgroundColor: theme.background }]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.step, { color: theme.text }]}>Tell Me About You</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Bar */}
        <ProgressBar currentStep={2} totalSteps={4} />

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <Animated.View
            style={[
              styles.slidingContainer,
              { backgroundColor: theme.surface, borderColor: theme.border, transform: [{ translateY: slideAnim }], opacity: fadeAnim }
            ]}
          >

            {/* Scrollable Content */}
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.headerSection}>
                {/* PA Avatar */}
                <View style={styles.paAvatarContainer}>
                  {assistantImage ? (
                    <Image source={{ uri: assistantImage }} style={[styles.paAvatar, { borderColor: theme.accent }]} />
                  ) : (
                    <View style={[styles.paAvatarPlaceholder, { backgroundColor: `${theme.accent}15`, borderColor: theme.accent }]}>
                      <MaterialIcons name="assistant" size={40} color={theme.accent} />
                    </View>
                  )}
                </View>

                {/* PA Question */}
                <View style={[styles.speechBubble, { backgroundColor: `${theme.accent}10`, borderColor: `${theme.accent}30` }]}>
                  <Text style={[styles.paQuestion, { color: theme.text }]}>
                    Hi Boss! What should I call you?
                  </Text>
                </View>
              </View>

              <View style={styles.formSection}>
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
                  <View style={[styles.inputContainer, { backgroundColor: `${theme.text}08`, borderColor: theme.border }]}>
                    <MaterialIcons name="badge" size={22} color={theme.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { color: theme.text }]}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="John Smith"
                      placeholderTextColor={theme.textTertiary}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Preferred Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Preferred Name</Text>
                  <View style={[styles.inputContainer, { backgroundColor: `${theme.text}08`, borderColor: theme.border }]}>
                    <MaterialIcons name="person-outline" size={22} color={theme.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { color: theme.text }]}
                      value={preferredName}
                      onChangeText={setPreferredName}
                      placeholder="John"
                      placeholderTextColor={theme.textTertiary}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleContinue}
                    />
                  </View>
                </View>

                {keyboardVisible && <View style={styles.keyboardSpacer} />}
              </View>
            </ScrollView>

            {/* Continue Button */}
            {!keyboardVisible && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    { backgroundColor: theme.accent },
                    !isFormValid || saving ? styles.disabledButton : null
                  ]}
                  onPress={handleContinue}
                  disabled={!isFormValid || saving}
                  activeOpacity={0.7}
                >
                  {saving ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={theme.background} />
                      <Text style={[styles.continueButtonText, { color: theme.background }]}>Saving...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.continueButtonText, { color: theme.background }]}>Continue</Text>
                      <MaterialIcons name="arrow-forward" size={20} color={theme.background} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>

        {/* Floating button when keyboard is visible */}
        {keyboardVisible && isFormValid && !saving && (
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
              style={[styles.floatingContinueButton, { backgroundColor: theme.accent, shadowColor: theme.accent }]}
              onPress={handleContinue}
            >
              <Text style={[styles.floatingButtonText, { color: theme.background }]}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={18} color={theme.background} />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  slidingContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
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
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  paAvatarContainer: {
    marginBottom: 20,
  },
  paAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
  },
  paAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  speechBubble: {
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: 18,
    marginHorizontal: 16,
    borderWidth: 2,
  },
  paName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  paQuestion: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
    paddingHorizontal: 20,
  },
  formSection: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 2,
    paddingHorizontal: 18,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  keyboardSpacer: {
    height: 100,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  continueButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    zIndex: 1000,
  },
  floatingContinueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default UserProfileSetupScreen;

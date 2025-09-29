import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type AssistantGenderNavigationProp = StackNavigationProp<RootStackParamList, 'AssistantGender'>;

interface VoiceOption {
  id: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  name: string;
  description: string;
  gender: 'male' | 'female';
  sampleText: string;
  pitch: number;
  rate: number;
}

const voiceOptions: VoiceOption[] = [
  // Female voices
  {
    id: 'nova',
    name: 'Nova',
    description: 'Warm and friendly',
    gender: 'female',
    sampleText: "Hello Boss!",
    pitch: 1.1,
    rate: 0.9,
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'Professional and clear',
    gender: 'female',
    sampleText: "Good morning Boss!",
    pitch: 1.0,
    rate: 0.85,
  },
  // Male voices
  {
    id: 'echo',
    name: 'Echo',
    description: 'Confident and reliable',
    gender: 'male',
    sampleText: "Hello Boss!",
    pitch: 0.8,
    rate: 0.9,
  },
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Deep and calming',
    gender: 'male',
    sampleText: "Good day Boss!",
    pitch: 0.7,
    rate: 0.8,
  },
];

const AssistantGenderScreen: React.FC = () => {
  const navigation = useNavigation<AssistantGenderNavigationProp>();
  const insets = useSafeAreaInsets();

  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [demoText, setDemoText] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, []);

  const handleGenderSelect = (gender: 'male' | 'female') => {
    setSelectedGender(gender);
    setSelectedVoice(null);
    setShowGenderDropdown(false);
  };

  const playVoiceSample = async (voice: VoiceOption) => {
    console.log('🎵 Demo: Playing voice sample for:', voice.name, voice.sampleText);

    if (isPlaying === voice.id) {
      console.log('🛑 Stopping currently playing voice');
      stopVoiceSample();
      return;
    }

    stopVoiceSample();
    setIsPlaying(voice.id);

    try {
      // Try real speech first (works in development builds)
      await Speech.speak(voice.sampleText, {
        language: 'en-US',
        pitch: voice.pitch,
        rate: voice.rate,
        onDone: () => {
          console.log('✅ Speech completed for:', voice.name);
          setIsPlaying(null);
        },
        onStopped: () => {
          console.log('🛑 Speech stopped for:', voice.name);
          setIsPlaying(null);
        },
        onError: (error: any) => {
          console.error('❌ Speech error for:', voice.name, error);
          setIsPlaying(null);
        },
      });
    } catch (error) {
      console.log('📱 Expo Go detected - using demo mode for voice preview');

      // Expo Go fallback: simulate voice playback with visual feedback
      setDemoText(`"${voice.sampleText}" - ${voice.description}`);
      setTimeout(() => {
        console.log(`🎭 Demo: "${voice.sampleText}" - ${voice.description}`);
        setIsPlaying(null);
        setDemoText(null);
      }, 2000); // 2 second demo
    }
  };

  const stopVoiceSample = () => {
    try {
      Speech.stop();
    } catch (error) {
      // Ignore speech stop errors in Expo Go
    }
    setIsPlaying(null);
    setDemoText(null);
  };

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
  };

  const handleContinue = async () => {
    console.log('🚀 Continue button pressed');
    console.log('🔍 Current state:', { selectedGender, selectedVoice });

    if (!selectedGender || !selectedVoice) {
      console.log('❌ Missing selections');
      Alert.alert('Selection Required', 'Please select both gender and voice for your assistant.');
      return;
    }

    console.log('✅ Both gender and voice selected, proceeding...');
    setLoading(true);

    try {
      console.log('📡 Calling API to save voice settings...');
      const response = await ApiService.updateAssistantVoice(
        selectedGender,
        selectedVoice
      );

      console.log('📡 API response:', response);

      if (response.success) {
        console.log('✅ Assistant gender and voice saved successfully');

        // Update user data in AsyncStorage for voice service
        const existingUserData = await AsyncStorage.getItem('userData');
        if (existingUserData) {
          const userData = JSON.parse(existingUserData);
          userData.assistantGender = response.data.assistantGender;
          userData.assistantVoice = response.data.assistantVoice;
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          console.log('💾 Updated AsyncStorage with voice settings');
        }
      } else {
        console.warn('⚠️ Failed to save assistant settings, continuing anyway');
      }

      // Navigate to the personalization screen
      console.log('🧭 Navigating to AssistantPersonalization...');
      navigation.navigate('AssistantPersonalization');
      console.log('🧭 Navigation called successfully');
    } catch (error: any) {
      console.error('❌ Failed to save assistant settings:', error);
      console.error('❌ Error details:', error.response?.data || error.message);

      // Skip API error and navigate anyway for testing
      console.log('🧭 API failed, but navigating to AssistantPersonalization anyway for testing...');
      navigation.navigate('AssistantPersonalization');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const filteredVoices = voiceOptions.filter(voice => voice.gender === selectedGender);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(0, 0, 0, 0.8)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Assistant Gender</Text>
          <Text style={styles.subtitle}>
            Select your assistant's gender and voice
          </Text>
        </View>

        <Animated.View
          style={[
            styles.slidingContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.step}>Gender Selection</Text>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              {/* Gender Selection */}
              <Text style={styles.sectionTitle}>Assistant Gender</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedGender ? selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1) : 'Select Gender'}
                </Text>
                <Ionicons
                  name={showGenderDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="rgba(255, 255, 255, 0.7)"
                />
              </TouchableOpacity>

              {showGenderDropdown && (
                <View style={styles.dropdown}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleGenderSelect('female')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="person" size={20} color="#3396D3" />
                    <Text style={styles.dropdownItemText}>Female</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleGenderSelect('male')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="person" size={20} color="#3396D3" />
                    <Text style={styles.dropdownItemText}>Male</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Demo Text Display */}
              {demoText && (
                <View style={styles.demoTextContainer}>
                  <Text style={styles.demoText}>🎭 Demo: {demoText}</Text>
                </View>
              )}

              {/* Voice Selection List */}
              {selectedGender && (
                <View style={styles.voiceSection}>
                  <Text style={styles.sectionTitle}>
                    Choose {selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)} Voice
                  </Text>
                  <View style={styles.voiceList}>
                    {filteredVoices.map((voice, index) => (
                      <View key={voice.id}>
                        <TouchableOpacity
                          style={[
                            styles.voiceItem,
                            selectedVoice === voice.id && styles.selectedVoiceItem
                          ]}
                          onPress={() => handleVoiceSelect(voice.id)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.voiceInfo}>
                            <Text style={styles.voiceName}>{voice.name}</Text>
                            <Text style={styles.voiceDescription}>{voice.description}</Text>
                          </View>

                          <TouchableOpacity
                            style={styles.playButton}
                            onPress={() => playVoiceSample(voice)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name={isPlaying === voice.id ? "stop" : "play"}
                              size={20}
                              color="#3396D3"
                            />
                          </TouchableOpacity>

                          {selectedVoice === voice.id && (
                            <Ionicons name="checkmark-circle" size={24} color="#3396D3" style={styles.checkmark} />
                          )}
                        </TouchableOpacity>
                        {index < filteredVoices.length - 1 && <View style={styles.voiceDivider} />}
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Continue Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                (!selectedGender || !selectedVoice) && styles.disabledButton,
              ]}
              onPress={handleContinue}
              disabled={!selectedGender || !selectedVoice || loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="large" />
              ) : (
                <Text style={[
                  styles.continueButtonText,
                  (!selectedGender || !selectedVoice) && styles.disabledButtonText,
                ]}>
                  Continue
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
    paddingTop: 20,
    paddingBottom: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 24,
  },
  slidingContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 15,
    paddingBottom: 10,
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
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 15,
    letterSpacing: 0.3,
  },
  dropdownButton: {
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 30,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
  },
  demoTextContainer: {
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    borderRadius: 12,
    padding: 15,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.3)',
  },
  demoText: {
    fontSize: 14,
    color: '#C9A96E',
    textAlign: 'center',
    fontWeight: '500',
  },
  voiceSection: {
    marginTop: 20,
  },
  voiceList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  selectedVoiceItem: {
    backgroundColor: 'rgba(51, 150, 211, 0.15)',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  voiceDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(51, 150, 211, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  checkmark: {
    marginLeft: 10,
  },
  voiceDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
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
});

export default AssistantGenderScreen;
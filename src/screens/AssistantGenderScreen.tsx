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

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProgressBar from '../components/ProgressBar';

const { width, height } = Dimensions.get('window');

type AssistantGenderNavigationProp = StackNavigationProp<RootStackParamList, 'AssistantGender'>;

interface VoiceOption {
  id: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  name: string;
  description: string;
  gender: 'male' | 'female';
  sampleText: string;
}

const voiceOptions: VoiceOption[] = [
  // Female voices
  {
    id: 'nova',
    name: 'Nova',
    description: 'Warm and friendly',
    gender: 'female',
    sampleText: "Hello Boss!",
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'Professional and clear',
    gender: 'female',
    sampleText: "Hello Boss!",
  },
  // Male voices
  {
    id: 'echo',
    name: 'Echo',
    description: 'Sharp and authoritative',
    gender: 'male',
    sampleText: "Hello Boss!",
  },
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Deep and powerful',
    gender: 'male',
    sampleText: "Hello Boss!",
  },
];

const AssistantGenderScreen: React.FC = () => {
  const navigation = useNavigation<AssistantGenderNavigationProp>();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [cachedAudio, setCachedAudio] = useState<Record<string, string>>({});
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Configure audio mode
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Pre-load all voice samples for instant playback
    preloadVoiceSamples();

    // Cleanup audio on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const preloadVoiceSamples = async () => {
    setIsLoadingSamples(true);
    console.log('🎵 Pre-loading all voice samples...');

    try {
      const cache: Record<string, string> = {};

      // Load all 4 voices in parallel
      await Promise.all(
        voiceOptions.map(async (voice) => {
          try {
            const audioDataUri = await ApiService.synthesizeSpeech(voice.sampleText, voice.id);
            cache[voice.id] = audioDataUri;
            console.log(`✅ Cached ${voice.name}`);
          } catch (error) {
            console.error(`❌ Failed to cache ${voice.name}:`, error);
          }
        })
      );

      setCachedAudio(cache);
      console.log(`✅ All voice samples cached (${Object.keys(cache).length}/4)`);
    } catch (error) {
      console.error('❌ Failed to preload voice samples:', error);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const handleGenderSelect = (gender: 'male' | 'female') => {
    setSelectedGender(gender);
    setSelectedVoice(null);
    setShowGenderDropdown(false);
  };

  const playVoiceSample = async (voice: VoiceOption) => {
    console.log('🎵 Playing voice sample for:', voice.name);

    // If already playing this voice, stop it
    if (isPlaying === voice.id) {
      console.log('🛑 Stopping currently playing voice');
      stopVoiceSample();
      return;
    }

    // Stop any currently playing audio
    await stopVoiceSample();
    setIsPlaying(voice.id);

    try {
      // Use cached audio if available, otherwise fetch it
      let audioDataUri = cachedAudio[voice.id];

      if (!audioDataUri) {
        console.log('📡 Audio not cached, fetching from API...');
        audioDataUri = await ApiService.synthesizeSpeech(voice.sampleText, voice.id);
        // Cache it for next time
        setCachedAudio(prev => ({ ...prev, [voice.id]: audioDataUri }));
      } else {
        console.log('⚡ Using cached audio - instant playback!');
      }

      // Create and load sound from data URI
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioDataUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              console.log('✅ Playback finished for:', voice.name);
              setIsPlaying(null);
              soundRef.current?.unloadAsync();
              soundRef.current = null;
            }
          }
        }
      );

      soundRef.current = sound;
      console.log('🔊 Playing audio...');

    } catch (error: any) {
      console.error('❌ TTS playback error:', error);
      Alert.alert(
        'Playback Error',
        'Unable to play voice sample. Please check your connection and try again.'
      );
      setIsPlaying(null);
    }
  };

  const stopVoiceSample = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
    setIsPlaying(null);
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background gradient */}


      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar - Fixed on black background */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 15) + 10, backgroundColor: theme.background }]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Choose Voice</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Bar */}
        <ProgressBar currentStep={3} totalSteps={4} />

        <Animated.View
          style={[
            styles.slidingContainer,
            { backgroundColor: theme.surface, borderColor: theme.border, transform: [{ translateY: slideAnim }] }
          ]}
        >

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              {/* Gender Selection */}
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Assistant Gender</Text>
              <TouchableOpacity
                style={[styles.dropdownButton, { backgroundColor: `${theme.text}08`, borderColor: theme.border }]}
                onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropdownButtonText, { color: theme.text }]}>
                  {selectedGender ? selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1) : 'Select Gender'}
                </Text>
                <Ionicons
                  name={showGenderDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>

              {showGenderDropdown && (
                <View style={[styles.dropdown, { backgroundColor: theme.surfaceSecondary }]}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleGenderSelect('female')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="person" size={20} color={theme.accent} />
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>Female</Text>
                  </TouchableOpacity>
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => handleGenderSelect('male')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="person" size={20} color={theme.accent} />
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>Male</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Voice Selection List */}
              {selectedGender && (
                <View style={styles.voiceSection}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Choose {selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)} Voice
                  </Text>
                  <View style={[styles.voiceList, { backgroundColor: theme.surfaceSecondary }]}>
                    {filteredVoices.map((voice, index) => (
                      <View key={voice.id}>
                        <TouchableOpacity
                          style={[
                            styles.voiceItem,
                            selectedVoice === voice.id && [styles.selectedVoiceItem, { backgroundColor: `${theme.accent}15` }]
                          ]}
                          onPress={() => handleVoiceSelect(voice.id)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.voiceInfo}>
                            <Text style={[styles.voiceName, { color: theme.text }]}>{voice.name}</Text>
                            <Text style={[styles.voiceDescription, { color: theme.textSecondary }]}>{voice.description}</Text>
                          </View>

                          <TouchableOpacity
                            style={[styles.playButton, { backgroundColor: `${theme.accent}20` }]}
                            onPress={() => playVoiceSample(voice)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name={isPlaying === voice.id ? "stop" : "play"}
                              size={20}
                              color={theme.accent}
                            />
                          </TouchableOpacity>

                          {selectedVoice === voice.id && (
                            <Ionicons name="checkmark-circle" size={24} color={theme.accent} style={styles.checkmark} />
                          )}
                        </TouchableOpacity>
                        {index < filteredVoices.length - 1 && <View style={[styles.voiceDivider, { backgroundColor: theme.border }]} />}
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
                { backgroundColor: theme.accent },
                (!selectedGender || !selectedVoice) && styles.disabledButton,
              ]}
              onPress={handleContinue}
              disabled={!selectedGender || !selectedVoice || loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={theme.background} size="large" />
              ) : (
                <Text style={[
                  styles.continueButtonText,
                  { color: theme.background },
                  (!selectedGender || !selectedVoice) && [styles.disabledButtonText, { color: theme.textTertiary }],
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
  title: {
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
  slidingContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
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
    fontWeight: '600',
    marginBottom: 15,
    letterSpacing: 0.3,
  },
  dropdownButton: {
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdown: {
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
    fontWeight: '500',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  voiceSection: {
    marginTop: 20,
  },
  voiceList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  selectedVoiceItem: {},
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  voiceDescription: {
    fontSize: 14,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  checkmark: {
    marginLeft: 10,
  },
  voiceDivider: {
    height: 1,
    marginHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  continueButton: {
    height: 65,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledButtonText: {},
});

export default AssistantGenderScreen;
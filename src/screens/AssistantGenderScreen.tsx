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
  FlatList,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import { setUser } from '../store/slices/userSlice';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProgressBar from '../components/ProgressBar';
import ReadyPlayerMeAvatar from '../components/ReadyPlayerMeAvatar';
import AvatarErrorBoundary from '../components/AvatarErrorBoundary';

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

interface AvatarOption {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  gender: 'male' | 'female';
}

// Avatar carousel dimensions - BIGGER avatars
const AVATAR_WIDTH = width * 0.85;
const AVATAR_SPACING = 20;

// Ready Player Me avatars matching voice options
const avatarOptions: AvatarOption[] = [
  // Female avatars (matching female voices)
  {
    id: 'avatar_nova',
    name: 'Nova',
    description: 'Warm and friendly',
    avatarUrl: 'https://models.readyplayer.me/68f602160f9f862ffe313e8e.glb',
    gender: 'female',
  },
  {
    id: 'avatar_shimmer',
    name: 'Shimmer',
    description: 'Professional and clear',
    avatarUrl: 'https://models.readyplayer.me/68f601379225c19d581f10c4.glb',
    gender: 'female',
  },
  // Male avatars (matching male voices)
  {
    id: 'avatar_echo',
    name: 'Echo',
    description: 'Sharp and authoritative',
    avatarUrl: 'https://models.readyplayer.me/68f601b0992c9fb50ce485f0.glb',
    gender: 'male',
  },
  {
    id: 'avatar_onyx',
    name: 'Onyx',
    description: 'Deep and powerful',
    avatarUrl: 'https://models.readyplayer.me/68f5fe3c0401b1cdf5913710.glb',
    gender: 'male',
  },
];

const AssistantGenderScreen: React.FC = () => {
  const navigation = useNavigation<AssistantGenderNavigationProp>();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const dispatch = useDispatch();

  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>('female');
  const [selectedVoice, setSelectedVoice] = useState<string | null>('nova'); // Default to Nova voice
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [cachedAudio, setCachedAudio] = useState<Record<string, string>>({});
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [assistantName, setAssistantName] = useState<string>('Assistant');

  // Avatar selection states - Default to Nova (female)
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>('avatar_nova');
  const [avatarLoadError, setAvatarLoadError] = useState<Record<string, boolean>>({});

  const slideAnim = useRef(new Animated.Value(height)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Animated value for gender slider (0 = female, 1 = male)
  const genderSliderAnim = useRef(new Animated.Value(0)).current;

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

    // Load assistant name from AsyncStorage
    loadAssistantName();

    // Pre-load all voice samples for instant playback
    preloadVoiceSamples();

    // Cleanup audio on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadAssistantName = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        if (parsedData.assistantName) {
          setAssistantName(parsedData.assistantName);
        }
      }
    } catch (error) {
      console.error('Failed to load assistant name:', error);
    }
  };

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

  const handleGenderSelect = async (gender: 'male' | 'female') => {
    // Haptic feedback for better UX
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setSelectedGender(gender);
    setShowGenderDropdown(false);

    // Animate slider smoothly
    Animated.spring(genderSliderAnim, {
      toValue: gender === 'female' ? 0 : 1,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();

    // Auto-select first avatar of selected gender
    const firstAvatar = avatarOptions.find(avatar => avatar.gender === gender);
    if (firstAvatar) {
      setSelectedAvatarId(firstAvatar.id);
      // Auto-select voice matching the avatar name
      const matchingVoice = voiceOptions.find(v => v.name === firstAvatar.name);
      if (matchingVoice) {
        setSelectedVoice(matchingVoice.id);
      }
    }

    // Play first voice sample of selected gender ("let it speak")
    const firstVoice = voiceOptions.find(voice => voice.gender === gender);
    if (firstVoice) {
      // Small delay to allow UI to settle
      setTimeout(() => {
        playVoiceSample(firstVoice);
      }, 300);
    }
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

  // Avatar carousel handlers
  const handleAvatarError = (avatarId: string) => {
    setAvatarLoadError((prev) => ({ ...prev, [avatarId]: true }));
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const filteredAvatars = avatarOptions.filter((avatar) => avatar.gender === selectedGender);
        const index = Math.round(offsetX / (AVATAR_WIDTH + AVATAR_SPACING));

        // Auto-select the avatar in the center
        if (filteredAvatars[index]) {
          setSelectedAvatarId(filteredAvatars[index].id);

          // Auto-select voice matching the avatar name
          const matchingVoice = voiceOptions.find(v => v.name === filteredAvatars[index].name);
          if (matchingVoice) {
            setSelectedVoice(matchingVoice.id);
          }
        }
      },
    }
  );

  const handleContinue = async () => {
    console.log('🚀 Continue button pressed');
    console.log('🔍 Current state:', { selectedGender, selectedVoice, selectedAvatarId });

    if (!selectedAvatarId || !selectedVoice) {
      console.log('❌ Missing avatar selection');
      Alert.alert('Selection Required', 'Please select an avatar for your assistant.');
      return;
    }

    console.log('✅ All selections complete, proceeding...');
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

      // Save selected avatar URL
      const selectedAvatar = avatarOptions.find((a) => a.id === selectedAvatarId);
      if (selectedAvatar) {
        console.log('📡 Saving selected avatar:', selectedAvatar.avatarUrl);
        const updatedUser = await ApiService.updateProfile({
          assistantProfileImage: selectedAvatar.avatarUrl,
        });
        console.log('✅ Avatar saved successfully');

        // Update Redux store with the new avatar
        dispatch(setUser(updatedUser));
        console.log('✅ Redux store updated with new avatar');
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

  const filteredAvatars = avatarOptions.filter((avatar) => avatar.gender === selectedGender);

  // Render avatar item for carousel
  const renderAvatarItem = ({ item, index }: { item: AvatarOption; index: number }) => {
    const isSelected = selectedAvatarId === item.id;
    const hasError = avatarLoadError[item.id];

    const inputRange = [
      (index - 1) * (AVATAR_WIDTH + AVATAR_SPACING),
      index * (AVATAR_WIDTH + AVATAR_SPACING),
      (index + 1) * (AVATAR_WIDTH + AVATAR_SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.avatarCard,
          {
            width: AVATAR_WIDTH,
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.avatarContainer,
            isSelected && styles.selectedAvatarContainer,
            { borderColor: isSelected ? theme.accent : theme.border },
          ]}
          onPress={() => {
            // Play voice sample when avatar is tapped
            const voice = voiceOptions.find(v => v.name === item.name);
            if (voice) {
              playVoiceSample(voice);
            }
          }}
          activeOpacity={0.8}
        >
          {!hasError ? (
            <AvatarErrorBoundary onError={() => handleAvatarError(item.id)}>
              <ReadyPlayerMeAvatar
                avatarUrl={item.avatarUrl}
                animationState="idle"
                onError={() => handleAvatarError(item.id)}
                containerStyle={styles.avatar3D}
              />
            </AvatarErrorBoundary>
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person-circle" size={80} color={theme.accent} />
            </View>
          )}

          {/* Play indicator overlay when playing */}
          {isPlaying && voiceOptions.find(v => v.name === item.name)?.id === isPlaying && (
            <View style={[styles.playingOverlay, { backgroundColor: `${theme.accent}30` }]}>
              <Ionicons name="volume-high" size={48} color={theme.accent} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.avatarInfo}>
          <Text style={[styles.avatarName, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.avatarDescription, { color: theme.textSecondary }]}>
            {item.description}
          </Text>
        </View>

        {isSelected && (
          <View style={[styles.selectedAvatarBadge, { backgroundColor: theme.accent }]}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background gradient */}


      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar - Fixed on black background */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 15) + 10, backgroundColor: theme.background }]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Setup {assistantName}</Text>
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

          <View style={styles.mainContent}>
            <View style={styles.content}>
              {/* Main Title */}
              <Text style={[styles.mainTitle, { color: theme.text }]}>Choose {assistantName}'s Voice & Avatar</Text>

              {/* Gender Selection - Sliding Toggle */}
              <View style={[styles.genderSliderContainer, { backgroundColor: theme.surfaceSecondary }]}>
                <Animated.View
                  style={[
                    styles.genderSliderIndicator,
                    {
                      backgroundColor: theme.accent,
                      left: genderSliderAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [4, 130], // Female at 4px, Male at 50% (130px for 260px container)
                      }),
                    }
                  ]}
                />

                <TouchableOpacity
                  style={styles.genderSliderOption}
                  onPress={() => handleGenderSelect('female')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="woman"
                    size={20}
                    color={selectedGender === 'female' ? '#FFFFFF' : theme.textSecondary}
                  />
                  <Text style={[
                    styles.genderSliderText,
                    { color: selectedGender === 'female' ? '#FFFFFF' : theme.textSecondary }
                  ]}>
                    Female
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.genderSliderOption}
                  onPress={() => handleGenderSelect('male')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="man"
                    size={20}
                    color={selectedGender === 'male' ? '#FFFFFF' : theme.textSecondary}
                  />
                  <Text style={[
                    styles.genderSliderText,
                    { color: selectedGender === 'male' ? '#FFFFFF' : theme.textSecondary }
                  ]}>
                    Male
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Avatar Selection Carousel - BIG and PROMINENT */}
              {selectedGender && (
                <View style={styles.avatarSection}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                    Swipe to browse • Tap avatar to play voice
                  </Text>

                  {/* Avatar Carousel */}
                  <View style={styles.carouselContainer}>
                    <Animated.FlatList
                      ref={flatListRef}
                      data={filteredAvatars}
                      renderItem={renderAvatarItem}
                      keyExtractor={(item) => item.id}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={AVATAR_WIDTH + AVATAR_SPACING}
                      decelerationRate="fast"
                      contentContainerStyle={{
                        paddingHorizontal: (width - AVATAR_WIDTH) / 2,
                      }}
                      onScroll={handleScroll}
                      scrollEventThrottle={16}
                    />
                  </View>

                  {/* Pagination Dots */}
                  <View style={styles.paginationContainer}>
                    {filteredAvatars.map((_, index) => {
                      const opacity = scrollX.interpolate({
                        inputRange: [
                          (index - 1) * (AVATAR_WIDTH + AVATAR_SPACING),
                          index * (AVATAR_WIDTH + AVATAR_SPACING),
                          (index + 1) * (AVATAR_WIDTH + AVATAR_SPACING),
                        ],
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                      });

                      return (
                        <Animated.View
                          key={index}
                          style={[
                            styles.paginationDot,
                            {
                              backgroundColor: theme.accent,
                              opacity,
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Continue Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: theme.accent },
                (!selectedAvatarId) && styles.disabledButton,
              ]}
              onPress={handleContinue}
              disabled={!selectedAvatarId || loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={theme.background} size="large" />
              ) : (
                <Text style={[
                  styles.continueButtonText,
                  { color: theme.background },
                  (!selectedAvatarId) && [styles.disabledButtonText, { color: theme.textTertiary }],
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
  mainContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 25,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Gender Slider Styles - MODERN TOGGLE
  genderSliderContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: 14,
    padding: 4,
    marginBottom: 25,
    position: 'relative',
    width: 260,
  },
  genderSliderIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: 122, // 48% of 260px container minus spacing
    borderRadius: 10,
    zIndex: 0,
  },
  genderSliderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    zIndex: 1,
  },
  genderSliderText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
  // Avatar carousel styles - BIGGER AND PROMINENT
  avatarSection: {
    marginBottom: 10,
  },
  carouselContainer: {
    height: 420,
    marginBottom: 15,
  },
  avatarCard: {
    alignItems: 'center',
    marginHorizontal: AVATAR_SPACING / 2,
  },
  avatarContainer: {
    width: AVATAR_WIDTH,
    height: 360,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  selectedAvatarContainer: {
    // No shadow or background for clean look
  },
  avatar3D: {
    width: AVATAR_WIDTH,
    height: 360,
    alignSelf: 'center',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  avatarInfo: {
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 15,
    width: '100%',
  },
  avatarName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
  },
  avatarDescription: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  selectedAvatarBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});

export default AssistantGenderScreen;
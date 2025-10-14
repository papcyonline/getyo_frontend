import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import ApiService from '../services/api';

const { height } = Dimensions.get('window');

type AgentCommunicationStyleNavigationProp = StackNavigationProp<RootStackParamList, 'AgentCommunicationStyle'>;

const AgentCommunicationStyleScreen: React.FC = () => {
  const navigation = useNavigation<AgentCommunicationStyleNavigationProp>();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [formalityLevel, setFormalityLevel] = useState(0.5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValue, setOriginalValue] = useState(0.5);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    loadFormalityLevel();
  }, []);

  useEffect(() => {
    setHasChanges(Math.abs(formalityLevel - originalValue) > 0.01);
  }, [formalityLevel, originalValue]);

  const loadFormalityLevel = async () => {
    try {
      setLoading(true);
      const settings = await ApiService.getAIAssistantSettings();
      if (settings?.intelligenceLevels?.formalityLevel !== undefined) {
        setFormalityLevel(settings.intelligenceLevels.formalityLevel);
        setOriginalValue(settings.intelligenceLevels.formalityLevel);
      }
    } catch (error: any) {
      console.error('Failed to load formality level:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await ApiService.updateIntelligenceLevel('formality', formalityLevel);
      setOriginalValue(formalityLevel);
      Alert.alert('Success', 'Communication style updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Failed to update formality level:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const getFormalityLabel = (value: number) => {
    if (value < 0.3) return 'Very Casual';
    if (value < 0.5) return 'Casual';
    if (value < 0.7) return 'Balanced';
    if (value < 0.85) return 'Professional';
    return 'Very Professional';
  };

  const getFormalityDescription = (value: number) => {
    if (value < 0.3) {
      return 'Your assistant uses relaxed, friendly language with casual expressions. Perfect for personal tasks and informal interactions.';
    }
    if (value < 0.5) {
      return 'Your assistant maintains a friendly tone while being clear and helpful. Great for everyday tasks and casual conversations.';
    }
    if (value < 0.7) {
      return 'Your assistant balances professionalism with approachability. Adapts to context and maintains versatile communication.';
    }
    if (value < 0.85) {
      return 'Your assistant uses polished, professional language suitable for business contexts and formal communications.';
    }
    return 'Your assistant maintains highly formal, business-appropriate language with precise terminology. Best for executive-level communications.';
  };

  const getExampleGreeting = (value: number) => {
    if (value < 0.3) return '"Hey! What can I help you with today?"';
    if (value < 0.5) return '"Hi there! How can I assist you?"';
    if (value < 0.7) return '"Hello! How may I help you today?"';
    if (value < 0.85) return '"Good day. How may I be of assistance?"';
    return '"Good morning/afternoon. How may I assist you today?"';
  };

  const getExampleResponse = (value: number) => {
    if (value < 0.3) return '"Got it! I\'ll take care of that for you right away."';
    if (value < 0.5) return '"Sure thing! I\'ll handle that for you."';
    if (value < 0.7) return '"Understood. I\'ll take care of this immediately."';
    if (value < 0.85) return '"Certainly. I will address this matter promptly."';
    return '"I acknowledge your request and will proceed accordingly."';
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Communication Style</Text>
          <Text style={styles.subtitle}>
            Adjust how formal your assistant's language is
          </Text>
        </View>

        <Animated.View
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.slidingContainer}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color="#C9A96E" />
              </TouchableOpacity>
              <Text style={styles.step}>AI Personality</Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#C9A96E" />
                  <Text style={styles.loadingText}>Loading settings...</Text>
                </View>
              ) : (
                <>
                  {/* Current Level Display */}
                  <View style={styles.levelDisplayCard}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="chatbubbles" size={48} color="#C9A96E" />
                    </View>
                    <Text style={styles.levelValue}>{getFormalityLabel(formalityLevel)}</Text>
                    <Text style={styles.levelPercentage}>{Math.round(formalityLevel * 100)}%</Text>
                  </View>

                  {/* Slider Section */}
                  <View style={styles.sliderSection}>
                    <View style={styles.sliderLabels}>
                      <Text style={styles.sliderLabelText}>Casual</Text>
                      <Text style={styles.sliderLabelText}>Professional</Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={1}
                      step={0.05}
                      value={formalityLevel}
                      onValueChange={setFormalityLevel}
                      minimumTrackTintColor="#C9A96E"
                      maximumTrackTintColor="rgba(255, 247, 245, 0.2)"
                      thumbTintColor="#C9A96E"
                    />
                    <View style={styles.sliderMarkers}>
                      {[0, 0.25, 0.5, 0.75, 1].map((marker) => (
                        <View
                          key={marker}
                          style={[
                            styles.sliderMarker,
                            formalityLevel >= marker && styles.sliderMarkerActive
                          ]}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Description */}
                  <View style={styles.descriptionSection}>
                    <Text style={styles.descriptionTitle}>What this means</Text>
                    <Text style={styles.descriptionText}>
                      {getFormalityDescription(formalityLevel)}
                    </Text>
                  </View>

                  {/* Example Messages */}
                  <View style={styles.examplesSection}>
                    <Text style={styles.examplesTitle}>Example Messages</Text>

                    <View style={styles.exampleCard}>
                      <View style={styles.exampleHeader}>
                        <Ionicons name="hand-right" size={20} color="#C9A96E" />
                        <Text style={styles.exampleHeaderText}>Greeting</Text>
                      </View>
                      <Text style={styles.exampleMessage}>{getExampleGreeting(formalityLevel)}</Text>
                    </View>

                    <View style={styles.exampleCard}>
                      <View style={styles.exampleHeader}>
                        <Ionicons name="checkmark-circle" size={20} color="#C9A96E" />
                        <Text style={styles.exampleHeaderText}>Confirmation</Text>
                      </View>
                      <Text style={styles.exampleMessage}>{getExampleResponse(formalityLevel)}</Text>
                    </View>
                  </View>

                  {/* Tips */}
                  <View style={styles.tipsSection}>
                    <View style={styles.tipItem}>
                      <Ionicons name="information-circle-outline" size={20} color="rgba(255, 247, 245, 0.6)" />
                      <Text style={styles.tipText}>
                        {formalityLevel < 0.5
                          ? 'Casual style is great for personal tasks and daily interactions'
                          : 'Professional style is ideal for business communications and formal settings'}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!hasChanges || saving) && styles.disabledButton
                ]}
                onPress={handleSave}
                disabled={!hasChanges || saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <View style={styles.savingContainer}>
                    <ActivityIndicator size="small" color="#000000" style={{ marginRight: 8 }} />
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  </View>
                ) : (
                  <Text style={[
                    styles.saveButtonText,
                    !hasChanges && styles.disabledButtonText
                  ]}>
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
  safeArea: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#C9A96E',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(201, 169, 110, 0.7)',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 24,
  },
  slidingContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 25,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.2)',
  },
  step: {
    fontSize: 14,
    color: '#C9A96E',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 247, 245, 0.7)',
    marginTop: 16,
    fontWeight: '500',
  },
  levelDisplayCard: {
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.2)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 169, 110, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF7F5',
    marginBottom: 8,
  },
  levelPercentage: {
    fontSize: 18,
    fontWeight: '500',
    color: '#C9A96E',
  },
  sliderSection: {
    marginBottom: 30,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sliderLabelText: {
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.6)',
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sliderMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 247, 245, 0.2)',
  },
  sliderMarkerActive: {
    backgroundColor: '#C9A96E',
  },
  descriptionSection: {
    backgroundColor: 'rgba(255, 247, 245, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.1)',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C9A96E',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: 'rgba(255, 247, 245, 0.8)',
    lineHeight: 22,
  },
  examplesSection: {
    marginBottom: 20,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C9A96E',
    marginBottom: 16,
  },
  exampleCard: {
    backgroundColor: 'rgba(255, 247, 245, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.1)',
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  exampleHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9A96E',
  },
  exampleMessage: {
    fontSize: 15,
    color: 'rgba(255, 247, 245, 0.9)',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  tipsSection: {
    marginTop: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.6)',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 20,
  },
  saveButton: {
    height: 65,
    backgroundColor: '#C9A96E',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
  },
  saveButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  disabledButtonText: {
    color: 'rgba(255, 247, 245, 0.4)',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AgentCommunicationStyleScreen;

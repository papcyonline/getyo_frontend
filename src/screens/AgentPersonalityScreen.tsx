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
import { MaterialIcons } from '@expo/vector-icons';
import ApiService from '../services/api';

const { height } = Dimensions.get('window');

type AgentPersonalityNavigationProp = StackNavigationProp<RootStackParamList, 'AgentPersonality'>;

interface PersonalityTrait {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const personalityTraits: PersonalityTrait[] = [
  { id: 'professional', name: 'Professional', description: 'Formal, business-focused communication', icon: 'business-center' },
  { id: 'friendly', name: 'Friendly', description: 'Warm, approachable, and conversational', icon: 'emoji-emotions' },
  { id: 'concise', name: 'Concise', description: 'Brief, to-the-point responses', icon: 'compress' },
  { id: 'detailed', name: 'Detailed', description: 'Thorough explanations and information', icon: 'list-alt' },
  { id: 'encouraging', name: 'Encouraging', description: 'Supportive and motivational tone', icon: 'thumb-up' },
  { id: 'analytical', name: 'Analytical', description: 'Data-driven, logical approach', icon: 'analytics' },
];

const AgentPersonalityScreen: React.FC = () => {
  const navigation = useNavigation<AgentPersonalityNavigationProp>();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableTraits, setAvailableTraits] = useState<PersonalityTrait[]>(personalityTraits);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    loadExistingConfiguration();
  }, []);

  const loadExistingConfiguration = async () => {
    try {
      setLoading(true);

      // Load existing configuration
      const existingConfig = await ApiService.getAgentConfiguration();
      if (existingConfig?.personality?.traits) {
        setSelectedPersonalities(existingConfig.personality.traits);
      }

      // Load available defaults to ensure we have the latest options
      const defaults = await ApiService.getAgentConfigDefaults();
      if (defaults?.personalityTraits) {
        setAvailableTraits(defaults.personalityTraits.map((trait: any) => ({
          id: trait.id,
          name: trait.name,
          description: trait.description,
          icon: getIconForTrait(trait.id),
        })));
      }
    } catch (error: any) {
      console.error('Failed to load existing configuration:', error);
      // Don't show error for first-time users, just use defaults
    } finally {
      setLoading(false);
    }
  };

  const getIconForTrait = (traitId: string): string => {
    const iconMap: { [key: string]: string } = {
      professional: 'business-center',
      friendly: 'emoji-emotions',
      concise: 'compress',
      detailed: 'list-alt',
      encouraging: 'thumb-up',
      analytical: 'analytics',
    };
    return iconMap[traitId] || 'circle';
  };

  const handlePersonalityToggle = (personalityId: string) => {
    setSelectedPersonalities(prev => {
      if (prev.includes(personalityId)) {
        return prev.filter(id => id !== personalityId);
      } else if (prev.length < 3) {
        return [...prev, personalityId];
      }
      return prev;
    });
  };

  const handleContinue = async () => {
    if (selectedPersonalities.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one personality trait to continue.');
      return;
    }

    try {
      setSaving(true);

      // Save personality preferences to backend
      await ApiService.updateAgentPersonality({
        traits: selectedPersonalities,
        communicationStyle: 'casual', // Default value
        responseStyle: 'balanced', // Default value
      });

      console.log('✅ Personality preferences saved successfully');

      // Navigate to next screen
      navigation.navigate('AgentAvailability');
    } catch (error: any) {
      console.error('❌ Failed to save personality preferences:', error);
      Alert.alert(
        'Save Failed',
        'Unable to save your personality preferences. Please try again.',
        [
          { text: 'Retry', onPress: handleContinue },
          { text: 'Skip for now', onPress: () => navigation.navigate('AgentAvailability') },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderPersonalityOption = (trait: PersonalityTrait, index: number) => {
    const isSelected = selectedPersonalities.includes(trait.id);
    const isLast = index === availableTraits.length - 1;

    return (
      <View key={trait.id}>
        <TouchableOpacity
          style={[styles.personalityItem, isSelected && styles.selectedItem]}
          onPress={() => handlePersonalityToggle(trait.id)}
          activeOpacity={0.7}
        >
          <View style={styles.itemContent}>
            <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
              <MaterialIcons
                name={trait.icon as any}
                size={24}
                color={isSelected ? '#FFF7F5' : '#FFF7F5'}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.traitName, isSelected && styles.selectedText]}>
                {trait.name}
              </Text>
              <Text style={[styles.traitDescription, isSelected && styles.selectedDescription]}>
                {trait.description}
              </Text>
            </View>
            {isSelected && (
              <View style={styles.checkmarkContainer}>
                <MaterialIcons name="check-circle" size={20} color="#FFF7F5" />
              </View>
            )}
          </View>
        </TouchableOpacity>
        {!isLast && <View style={styles.divider} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Agent Personality</Text>
          <Text style={styles.subtitle}>
            Choose up to 3 traits that define your AI assistant's personality
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
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.step}>Personality Setup</Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.selectionInfo}>
                <Text style={styles.infoText}>
                  Selected: {selectedPersonalities.length}/3
                </Text>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3396D3" />
                  <Text style={styles.loadingText}>Loading personality options...</Text>
                </View>
              ) : (
                <View style={styles.personalityList}>
                  {availableTraits.map((trait, index) => renderPersonalityOption(trait, index))}
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (selectedPersonalities.length === 0 || saving) && styles.disabledButton
                ]}
                onPress={handleContinue}
                disabled={selectedPersonalities.length === 0 || saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <View style={styles.savingContainer}>
                    <ActivityIndicator size="small" color="#FFF7F5" style={{ marginRight: 8 }} />
                    <Text style={styles.continueButtonText}>Saving...</Text>
                  </View>
                ) : (
                  <Text style={[
                    styles.continueButtonText,
                    selectedPersonalities.length === 0 && styles.disabledButtonText
                  ]}>
                    Continue
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
  gradientFlare: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 15,
    alignItems: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF7F5',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 247, 245, 0.7)',
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
    paddingTop: 15,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.2)',
  },
  backButtonText: {
    color: '#FFF7F5',
    fontSize: 22,
    fontWeight: '600',
  },
  step: {
    fontSize: 14,
    color: '#FFF7F5',
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
    flexGrow: 1,
  },
  selectionInfo: {
    backgroundColor: 'rgba(255, 247, 245, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.1)',
  },
  infoText: {
    fontSize: 14,
    color: '#FFF7F5',
    textAlign: 'center',
    fontWeight: '600',
  },
  personalityList: {
    paddingHorizontal: 10,
  },
  personalityItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  selectedItem: {
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    borderRadius: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    marginHorizontal: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedIconContainer: {
    backgroundColor: '#3396D3',
  },
  textContainer: {
    flex: 1,
  },
  traitName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 247, 245, 0.9)',
    marginBottom: 4,
  },
  selectedText: {
    color: '#FFF7F5',
  },
  traitDescription: {
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.6)',
    lineHeight: 20,
  },
  selectedDescription: {
    color: 'rgba(255, 247, 245, 0.9)',
  },
  checkmarkContainer: {
    marginLeft: 12,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 20,
  },
  continueButton: {
    height: 65,
    backgroundColor: '#3396D3',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF7F5',
    letterSpacing: 0.5,
  },
  disabledButtonText: {
    color: 'rgba(255, 247, 245, 0.4)',
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
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AgentPersonalityScreen;
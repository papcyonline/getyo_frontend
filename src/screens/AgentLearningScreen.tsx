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
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import ApiService from '../services/api';

const { height } = Dimensions.get('window');

type AgentLearningNavigationProp = StackNavigationProp<RootStackParamList, 'AgentLearning'>;

interface LearningPreference {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: 'behavior' | 'data' | 'personalization';
}

interface LearningStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  selected: boolean;
}

const learningPreferences: LearningPreference[] = [
  {
    id: 'adaptive_responses',
    title: 'Adaptive Responses',
    description: 'Learn from your communication style and preferences',
    icon: 'psychology',
    enabled: false, // Will be loaded from backend
    category: 'behavior'
  },
  {
    id: 'pattern_recognition',
    title: 'Pattern Recognition',
    description: 'Identify patterns in your daily routines and habits',
    icon: 'analytics',
    enabled: false, // Will be loaded from backend
    category: 'behavior'
  },
  {
    id: 'contextual_learning',
    title: 'Contextual Learning',
    description: 'Understand context from your conversations and actions',
    icon: 'lightbulb',
    enabled: false, // Will be loaded from backend
    category: 'behavior'
  },
  {
    id: 'preference_memory',
    title: 'Preference Memory',
    description: 'Remember your choices and apply them to future interactions',
    icon: 'memory',
    enabled: false, // This is not saved to backend, local UI only
    category: 'personalization'
  },
  {
    id: 'usage_analytics',
    title: 'Usage Analytics',
    description: 'Analyze your usage patterns to improve performance',
    icon: 'trending-up',
    enabled: false, // This is not saved to backend, local UI only
    category: 'data'
  },
  {
    id: 'feedback_learning',
    title: 'Feedback Learning',
    description: 'Learn from your feedback and corrections',
    icon: 'feedback',
    enabled: false, // This is not saved to backend, local UI only
    category: 'behavior'
  },
  {
    id: 'personalized_suggestions',
    title: 'Personalized Suggestions',
    description: 'Provide suggestions based on your history and preferences',
    icon: 'recommend',
    enabled: false, // Will be loaded from backend
    category: 'personalization'
  },
  {
    id: 'data_insights',
    title: 'Data Insights',
    description: 'Generate insights from your data and activity',
    icon: 'insights',
    enabled: false, // This is not saved to backend, local UI only
    category: 'data'
  },
];

const learningStyles: LearningStyle[] = [
  {
    id: 'conservative',
    name: 'Conservative Learning',
    description: 'Learn slowly and only from explicit feedback',
    icon: 'security',
    selected: false
  },
  {
    id: 'balanced',
    name: 'Balanced Learning',
    description: 'Moderate learning from interactions and patterns',
    icon: 'balance',
    selected: true
  },
  {
    id: 'aggressive',
    name: 'Aggressive Learning',
    description: 'Learn quickly from all available data and interactions',
    icon: 'speed',
    selected: false
  },
];

const AgentLearningScreen: React.FC = () => {
  const navigation = useNavigation<AgentLearningNavigationProp>();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [preferences, setPreferences] = useState<LearningPreference[]>(learningPreferences);
  const [selectedStyle, setSelectedStyle] = useState<LearningStyle>(
    learningStyles.find(style => style.selected) || learningStyles[1]
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

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
      if (existingConfig?.learning) {
        const learning = existingConfig.learning;

        // Update preferences based on existing config
        const updatedPreferences = preferences.map(pref => {
          switch (pref.id) {
            case 'adaptive_responses':
              return { ...pref, enabled: learning.adaptToUserStyle || false };
            case 'pattern_recognition':
              return { ...pref, enabled: learning.learnFromInteractions || false };
            case 'personalized_suggestions':
              return { ...pref, enabled: learning.suggestImprovements || false };
            case 'contextual_learning':
              return { ...pref, enabled: learning.contextualLearning || false };
            default:
              return pref;
          }
        });

        setPreferences(updatedPreferences);
      }
    } catch (error: any) {
      console.error('Failed to load existing learning configuration:', error);
      // Don't show error for first-time users, just use defaults
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceToggle = (preferenceId: string) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === preferenceId
          ? { ...pref, enabled: !pref.enabled }
          : pref
      )
    );
  };

  const handleStyleSelect = (styleId: string) => {
    const style = learningStyles.find(s => s.id === styleId);
    if (style) {
      setSelectedStyle(style);
    }
  };

  const handleContinue = async () => {
    try {
      setSaving(true);

      // Map learning preferences to backend format
      const learningData = {
        adaptToUserStyle: preferences.find(p => p.id === 'adaptive_responses')?.enabled || false,
        learnFromInteractions: preferences.find(p => p.id === 'pattern_recognition')?.enabled || false,
        suggestImprovements: preferences.find(p => p.id === 'personalized_suggestions')?.enabled || false,
        contextualLearning: preferences.find(p => p.id === 'contextual_learning')?.enabled || false,
      };

      // Save learning preferences to backend
      await ApiService.updateAgentLearning(learningData);

      console.log('✅ Learning preferences saved successfully');

      // Navigate to next screen
      navigation.navigate('AgentPrivacy');
    } catch (error: any) {
      console.error('❌ Failed to save learning preferences:', error);
      Alert.alert(
        'Save Failed',
        'Unable to save your learning preferences. Please try again.',
        [
          { text: 'Retry', onPress: handleContinue },
          { text: 'Skip for now', onPress: () => navigation.navigate('AgentPrivacy') },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const getPreferencesByCategory = (category: string) => {
    return preferences.filter(pref => pref.category === category);
  };

  const renderLearningPreference = (preference: LearningPreference, index: number, totalCount: number) => {
    const isLast = index === totalCount - 1;

    return (
      <View key={preference.id}>
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceContent}>
            <View style={styles.preferenceIcon}>
              <MaterialIcons name={preference.icon as any} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.preferenceTextContainer}>
              <Text style={styles.preferenceTitle}>{preference.title}</Text>
              <Text style={styles.preferenceDescription}>{preference.description}</Text>
            </View>
            <Switch
              value={preference.enabled}
              onValueChange={() => handlePreferenceToggle(preference.id)}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#3396D3' }}
              thumbColor={preference.enabled ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
              ios_backgroundColor="rgba(255, 255, 255, 0.1)"
            />
          </View>
        </View>
        {!isLast && <View style={styles.divider} />}
      </View>
    );
  };

  const renderLearningStyle = (style: LearningStyle, index: number) => {
    const isSelected = selectedStyle.id === style.id;
    const isLast = index === learningStyles.length - 1;

    return (
      <View key={style.id}>
        <TouchableOpacity
          style={[styles.styleItem, isSelected && styles.selectedStyleItem]}
          onPress={() => handleStyleSelect(style.id)}
          activeOpacity={0.7}
        >
          <View style={styles.styleContent}>
            <View style={[styles.styleIconContainer, isSelected && styles.selectedStyleIcon]}>
              <MaterialIcons
                name={style.icon as any}
                size={24}
                color={isSelected ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
            <View style={styles.styleTextContainer}>
              <Text style={[styles.styleName, isSelected && styles.selectedText]}>
                {style.name}
              </Text>
              <Text style={[styles.styleDescription, isSelected && styles.selectedDescription]}>
                {style.description}
              </Text>
            </View>
            {isSelected && (
              <View style={styles.checkmarkContainer}>
                <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              </View>
            )}
          </View>
        </TouchableOpacity>
        {!isLast && <View style={styles.divider} />}
      </View>
    );
  };

  const renderCategory = (categoryKey: string, categoryName: string) => {
    const categoryPreferences = getPreferencesByCategory(categoryKey);
    if (categoryPreferences.length === 0) return null;

    return (
      <View key={categoryKey} style={styles.category}>
        <Text style={styles.categoryTitle}>{categoryName}</Text>
        <View style={styles.preferencesList}>
          {categoryPreferences.map((preference, index) => renderLearningPreference(preference, index, categoryPreferences.length))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(51, 150, 211, 0.2)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        pointerEvents="none"
      />


      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Learning Preferences</Text>
          <Text style={styles.subtitle}>
            Configure how your AI assistant learns and adapts to you
          </Text>
        </View>

        <Animated.View
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: Math.max(insets.bottom, 20) + 20,
              marginBottom: -insets.bottom
            }
          ]}
        >
          <View style={styles.slidingContainer}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.step}>Learning Setup</Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3396D3" />
                  <Text style={styles.loadingText}>Loading learning preferences...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.selectionInfo}>
                    <Text style={styles.infoText}>
                      Enabled: {preferences.filter(p => p.enabled).length}/{preferences.length} features
                    </Text>
                    <Text style={styles.infoSubtext}>
                      These settings control how your assistant learns from your interactions
                    </Text>
                  </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Learning Style</Text>
                <Text style={styles.sectionDescription}>
                  Choose how aggressively your assistant should learn from your behavior
                </Text>
                <View style={styles.stylesList}>
                  {learningStyles.map((style, index) => renderLearningStyle(style, index))}
                </View>
              </View>

              {renderCategory('behavior', 'Behavioral Learning')}
              {renderCategory('personalization', 'Personalization')}
              {renderCategory('data', 'Data Analytics')}

              <View style={styles.privacyNote}>
                <MaterialIcons name="lock" size={16} color="#FFFFFF" />
                <Text style={styles.privacyText}>
                  All learning happens locally on your device. Your data remains private and secure.
                </Text>
              </View>
                </>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  saving && styles.disabledButton
                ]}
                onPress={handleContinue}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <View style={styles.savingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.continueButtonText}>Saving...</Text>
                  </View>
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
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
    fontSize: 16,
    color: '#F7F2ED',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  animatedContainer: {
    flex: 1,
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
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  selectionInfo: {
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 150, 211, 0.3)',
  },
  infoText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '400',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
    lineHeight: 20,
  },
  stylesList: {
    paddingHorizontal: 10,
  },
  styleItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  selectedStyleItem: {
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    borderRadius: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  styleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  styleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedStyleIcon: {
    backgroundColor: '#FFFFFF',
  },
  styleTextContainer: {
    flex: 1,
  },
  styleName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  styleDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  selectedDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  checkmarkContainer: {
    marginLeft: 12,
  },
  category: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  preferencesList: {
    paddingHorizontal: 10,
  },
  preferenceItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  preferenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  preferenceTextContainer: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  privacyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 30,
    paddingVertical: 25,
  },
  continueButton: {
    height: 65,
    backgroundColor: '#3396D3',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
    fontWeight: '500',
  },
});

export default AgentLearningScreen;
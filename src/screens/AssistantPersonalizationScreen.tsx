import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { RootStackParamList } from '../types';
import ApiService from '../services/api';

const { height, width } = Dimensions.get('window');

type AssistantPersonalizationNavigationProp = StackNavigationProp<RootStackParamList, 'AssistantPersonalization'>;

interface PersonalizationData {
  role: string;
  customRole?: string;
  challenges: string[];
  workStyle: number; // 0-100: Structured to Flexible
  productiveTime: string[];
  communicationPreference: string;
  meetingPreference: string;
}

const roles = [
  { id: 'ceo', label: 'CEO/Founder', icon: 'business-center' },
  { id: 'manager', label: 'Manager', icon: 'group' },
  { id: 'developer', label: 'Developer', icon: 'code' },
  { id: 'designer', label: 'Designer', icon: 'palette' },
  { id: 'marketer', label: 'Marketer', icon: 'campaign' },
  { id: 'sales', label: 'Sales', icon: 'trending-up' },
  { id: 'student', label: 'Student', icon: 'school' },
  { id: 'other', label: 'Other', icon: 'add-circle-outline' },
];

const challenges = [
  { id: 'email_overload', label: 'Email overload', icon: 'email' },
  { id: 'too_many_meetings', label: 'Too many meetings', icon: 'event' },
  { id: 'task_tracking', label: 'Task tracking', icon: 'checklist' },
  { id: 'time_management', label: 'Time management', icon: 'schedule' },
  { id: 'context_switching', label: 'Context switching', icon: 'swap-horiz' },
  { id: 'prioritization', label: 'Prioritization', icon: 'low-priority' },
  { id: 'communication', label: 'Team communication', icon: 'forum' },
  { id: 'deadlines', label: 'Meeting deadlines', icon: 'alarm' },
];

const productiveTimes = [
  { id: 'early_morning', label: 'Early Morning (5-8 AM)', icon: 'wb-twilight' },
  { id: 'morning', label: 'Morning (8-12 PM)', icon: 'wb-sunny' },
  { id: 'afternoon', label: 'Afternoon (12-5 PM)', icon: 'light-mode' },
  { id: 'evening', label: 'Evening (5-9 PM)', icon: 'wb-cloudy' },
  { id: 'night', label: 'Night (9 PM+)', icon: 'nights-stay' },
];

const communicationPreferences = [
  { id: 'gentle', label: 'Gentle nudges', icon: 'notifications-none' },
  { id: 'balanced', label: 'Balanced', icon: 'notifications-active' },
  { id: 'direct', label: 'Direct alerts', icon: 'notification-important' },
];

const meetingPreferences = [
  { id: 'minimal', label: 'Minimal prep', icon: 'event-available' },
  { id: 'balanced', label: 'Balanced prep', icon: 'event-note' },
  { id: 'detailed', label: 'Detailed prep', icon: 'event-busy' },
];

const AssistantPersonalizationScreen: React.FC = () => {
  const navigation = useNavigation<AssistantPersonalizationNavigationProp>();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const [data, setData] = useState<PersonalizationData>({
    role: '',
    customRole: '',
    challenges: [],
    workStyle: 50, // Default to middle (balanced)
    productiveTime: [],
    communicationPreference: 'balanced',
    meetingPreference: 'balanced',
  });

  const [showCustomRole, setShowCustomRole] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRoleSelect = (roleId: string) => {
    if (roleId === 'other') {
      setShowCustomRole(true);
      setData(prev => ({ ...prev, role: roleId }));
    } else {
      setShowCustomRole(false);
      setData(prev => ({ ...prev, role: roleId, customRole: '' }));
    }
  };

  const toggleChallenge = (challengeId: string) => {
    setData(prev => ({
      ...prev,
      challenges: prev.challenges.includes(challengeId)
        ? prev.challenges.filter(id => id !== challengeId)
        : [...prev.challenges, challengeId],
    }));
  };

  const toggleProductiveTime = (timeId: string) => {
    setData(prev => ({
      ...prev,
      productiveTime: prev.productiveTime.includes(timeId)
        ? prev.productiveTime.filter(id => id !== timeId)
        : [...prev.productiveTime, timeId],
    }));
  };

  const isFormValid = () => {
    if (!data.role) return false;
    if (data.role === 'other' && !data.customRole?.trim()) return false;
    if (data.challenges.length === 0) return false;
    if (data.productiveTime.length === 0) return false;
    return true;
  };

  const handleContinue = async () => {
    if (!isFormValid()) {
      Alert.alert('Incomplete', 'Please complete all sections before continuing.');
      return;
    }

    setLoading(true);
    try {
      // Prepare agent configuration based on user responses
      const agentConfig = {
        personality: derivePersonality(data),
        availability: deriveAvailability(data),
        taskCategories: deriveTaskCategories(data),
        learning: {
          adaptToUserStyle: true,
          learnFromInteractions: true,
          suggestImprovements: true,
          contextualLearning: true,
        },
        privacy: {
          dataRetentionDays: 90,
          shareAnalytics: true,
          personalizeExperience: true,
          crossDeviceSync: true,
        },
      };

      // Save personality configuration
      await ApiService.updateAgentPersonality(
        agentConfig.personality.traits,
        agentConfig.personality.communicationStyle,
        agentConfig.personality.responseStyle
      );

      // Save availability configuration
      await ApiService.updateAgentAvailability(agentConfig.availability);

      // Save task categories
      await ApiService.updateAgentTaskCategories(
        agentConfig.taskCategories.enabledCategories,
        agentConfig.taskCategories.priorityOrder
      );

      // Save learning preferences
      await ApiService.updateAgentLearning(agentConfig.learning);

      // Save privacy settings
      await ApiService.updateAgentPrivacy(agentConfig.privacy);

      console.log('✅ Personalization saved successfully');

      // Mark onboarding as complete and navigate to home
      await ApiService.completeAgentSetup();

      // Navigate to home screen (reset navigation stack)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });

    } catch (error: any) {
      console.error('Failed to save personalization:', error);
      Alert.alert(
        'Error',
        'Failed to save your preferences. Would you like to continue with manual setup?',
        [
          { text: 'Retry', onPress: handleContinue },
          { text: 'Manual Setup', onPress: () => navigation.navigate('AgentPersonality') },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const derivePersonality = (data: PersonalizationData) => {
    const traits: string[] = [];

    // Role-based traits
    if (['ceo', 'manager'].includes(data.role)) {
      traits.push('professional', 'concise');
    } else if (['developer', 'designer'].includes(data.role)) {
      traits.push('detailed', 'analytical');
    } else if (['marketer', 'sales'].includes(data.role)) {
      traits.push('friendly', 'encouraging');
    }

    // Work style traits
    if (data.workStyle < 33) {
      traits.push('professional', 'detailed');
    } else if (data.workStyle > 66) {
      traits.push('friendly', 'encouraging');
    } else {
      traits.push('friendly', 'concise');
    }

    return {
      traits: [...new Set(traits)].slice(0, 3), // Unique, max 3
      communicationStyle: data.workStyle > 50 ? 'casual' : 'professional',
      responseStyle: data.communicationPreference === 'direct' ? 'concise' : 'balanced',
    };
  };

  const deriveAvailability = (data: PersonalizationData) => {
    // Convert productive times to working hours
    const timeMapping: Record<string, { start: string; end: string }> = {
      early_morning: { start: '05:00', end: '08:00' },
      morning: { start: '08:00', end: '12:00' },
      afternoon: { start: '12:00', end: '17:00' },
      evening: { start: '17:00', end: '21:00' },
      night: { start: '21:00', end: '23:59' },
    };

    const times = data.productiveTime.map(t => timeMapping[t]);
    const startTime = times[0]?.start || '09:00';
    const endTime = times[times.length - 1]?.end || '17:00';

    return {
      alwaysAvailable: false,
      workingHours: { start: startTime, end: endTime },
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      quietHours: { start: '22:00', end: '07:00' },
      urgentOnly: false,
      preferredTimeSlots: data.productiveTime.map(id => ({
        id,
        label: productiveTimes.find(t => t.id === id)?.label || '',
        enabled: true,
      })),
    };
  };

  const deriveTaskCategories = (data: PersonalizationData) => {
    // Valid categories from backend: scheduling, email_management, research, reminders,
    // travel_planning, document_management, social_media, finance_tracking
    const categoryMapping: Record<string, string[]> = {
      email_overload: ['email_management'],
      too_many_meetings: ['scheduling', 'reminders'],
      task_tracking: ['reminders', 'document_management'],
      time_management: ['scheduling', 'reminders'],
      context_switching: ['reminders', 'research'],
      prioritization: ['reminders', 'scheduling'],
      communication: ['email_management', 'social_media'],
      deadlines: ['reminders', 'scheduling'],
    };

    const enabledCategories: string[] = [];
    data.challenges.forEach(challenge => {
      const cats = categoryMapping[challenge] || [];
      enabledCategories.push(...cats);
    });

    const uniqueCategories = [...new Set(enabledCategories)];

    // If no categories derived, use defaults
    const finalCategories = uniqueCategories.length > 0
      ? uniqueCategories
      : ['scheduling', 'email_management', 'reminders', 'research'];

    return {
      enabledCategories: finalCategories,
      priorityOrder: finalCategories,
    };
  };

  const renderRoleSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>What's your role?</Text>
      <Text style={styles.sectionSubtitle}>This helps me understand your needs</Text>

      <View style={styles.chipsContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.chip,
              data.role === role.id && styles.chipSelected,
            ]}
            onPress={() => handleRoleSelect(role.id)}
          >
            <MaterialIcons
              name={role.icon as any}
              size={20}
              color={data.role === role.id ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)'}
            />
            <Text style={[
              styles.chipText,
              data.role === role.id && styles.chipTextSelected,
            ]}>
              {role.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showCustomRole && (
        <TextInput
          style={styles.customInput}
          placeholder="Enter your role..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={data.customRole}
          onChangeText={(text) => setData(prev => ({ ...prev, customRole: text }))}
          autoFocus
        />
      )}
    </View>
  );

  const renderChallengesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>What are your biggest challenges?</Text>
      <Text style={styles.sectionSubtitle}>Select all that apply</Text>

      <View style={styles.chipsContainer}>
        {challenges.map((challenge) => {
          const isSelected = data.challenges.includes(challenge.id);
          return (
            <TouchableOpacity
              key={challenge.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
              ]}
              onPress={() => toggleChallenge(challenge.id)}
            >
              <MaterialIcons
                name={challenge.icon as any}
                size={20}
                color={isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)'}
              />
              <Text style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
              ]}>
                {challenge.label}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderWorkStyleSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>How do you prefer to work?</Text>
      <Text style={styles.sectionSubtitle}>Slide to adjust</Text>

      <View style={styles.sliderContainer}>
        <View style={styles.sliderLabels}>
          <View style={styles.sliderLabelItem}>
            <Ionicons name="list" size={24} color="#3396D3" />
            <Text style={styles.sliderLabelText}>Structured</Text>
          </View>
          <View style={styles.sliderLabelItem}>
            <Ionicons name="shuffle" size={24} color="#3396D3" />
            <Text style={styles.sliderLabelText}>Flexible</Text>
          </View>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={data.workStyle}
          onValueChange={(value) => setData(prev => ({ ...prev, workStyle: value }))}
          minimumTrackTintColor="#3396D3"
          maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
          thumbTintColor="#3396D3"
        />

        <Text style={styles.sliderValue}>
          {data.workStyle < 33 ? 'Structured' : data.workStyle > 66 ? 'Flexible' : 'Balanced'}
        </Text>
      </View>
    </View>
  );

  const renderProductiveTimeSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>When are you most productive?</Text>
      <Text style={styles.sectionSubtitle}>Select your peak times</Text>

      <View style={styles.chipsContainer}>
        {productiveTimes.map((time) => {
          const isSelected = data.productiveTime.includes(time.id);
          return (
            <TouchableOpacity
              key={time.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
              ]}
              onPress={() => toggleProductiveTime(time.id)}
            >
              <MaterialIcons
                name={time.icon as any}
                size={20}
                color={isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)'}
              />
              <Text style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
              ]}>
                {time.label}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderCommunicationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Communication style</Text>
      <Text style={styles.sectionSubtitle}>How should I notify you?</Text>

      <View style={styles.optionsContainer}>
        {communicationPreferences.map((pref) => (
          <TouchableOpacity
            key={pref.id}
            style={[
              styles.optionCard,
              data.communicationPreference === pref.id && styles.optionCardSelected,
            ]}
            onPress={() => setData(prev => ({ ...prev, communicationPreference: pref.id }))}
          >
            <MaterialIcons
              name={pref.icon as any}
              size={32}
              color={data.communicationPreference === pref.id ? '#3396D3' : 'rgba(255, 255, 255, 0.5)'}
            />
            <Text style={[
              styles.optionCardText,
              data.communicationPreference === pref.id && styles.optionCardTextSelected,
            ]}>
              {pref.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMeetingSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Meeting preparation</Text>
      <Text style={styles.sectionSubtitle}>How much prep do you need?</Text>

      <View style={styles.optionsContainer}>
        {meetingPreferences.map((pref) => (
          <TouchableOpacity
            key={pref.id}
            style={[
              styles.optionCard,
              data.meetingPreference === pref.id && styles.optionCardSelected,
            ]}
            onPress={() => setData(prev => ({ ...prev, meetingPreference: pref.id }))}
          >
            <MaterialIcons
              name={pref.icon as any}
              size={32}
              color={data.meetingPreference === pref.id ? '#3396D3' : 'rgba(255, 255, 255, 0.5)'}
            />
            <Text style={[
              styles.optionCardText,
              data.meetingPreference === pref.id && styles.optionCardTextSelected,
            ]}>
              {pref.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(0, 0, 0, 0.8)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="rgba(255, 255, 255, 0.9)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personalize Your Assistant</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {data.challenges.length > 0 && data.productiveTime.length > 0 && data.role
              ? 'Almost done! 🎉'
              : 'Tell me about yourself'}
          </Text>
        </View>

        {/* Scrollable Content */}
        <Animated.View
          style={[
            styles.slidingContainer,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
          ]}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderRoleSection()}
            {renderChallengesSection()}
            {renderWorkStyleSection()}
            {renderProductiveTimeSection()}
            {renderCommunicationSection()}
            {renderMeetingSection()}

            {/* Spacer for bottom button */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </Animated.View>

        {/* Fixed Bottom Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isFormValid() && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isFormValid() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
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
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  progressText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  slidingContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chipSelected: {
    backgroundColor: '#3396D3',
    borderColor: '#3396D3',
  },
  chipText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  customInput: {
    marginTop: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sliderContainer: {
    paddingVertical: 10,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sliderLabelItem: {
    alignItems: 'center',
    gap: 8,
  },
  sliderLabelText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    textAlign: 'center',
    fontSize: 18,
    color: '#3396D3',
    fontWeight: '600',
    marginTop: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  optionCardSelected: {
    borderColor: '#3396D3',
    backgroundColor: 'rgba(51, 150, 211, 0.15)',
  },
  optionCardText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },
  optionCardTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3396D3',
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#3396D3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowOpacity: 0,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AssistantPersonalizationScreen;
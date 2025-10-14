import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import { setUser } from '../store/slices/userSlice';

const AIAssistantScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();

  // Debug logging
  useEffect(() => {
    console.log('🔍 AI Assistant Screen - User data:', {
      assistantName: user?.assistantName,
      assistantProfileImage: user?.assistantProfileImage,
      name: user?.name,
      preferredName: user?.preferredName,
      fullUser: user
    });
  }, [user]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Core AI Settings
  const [proactiveMode, setProactiveMode] = useState(true);
  const [smartSuggestions, setSmartSuggestions] = useState(true);
  const [contextAwareness, setContextAwareness] = useState(true);
  const [learningMode, setLearningMode] = useState(true);
  const [voiceCommands, setVoiceCommands] = useState(true);

  // Task Management
  const [autoScheduling, setAutoScheduling] = useState(true);
  const [priorityIntelligence, setPriorityIntelligence] = useState(true);
  const [deadlineTracking, setDeadlineTracking] = useState(true);
  const [followUpReminders, setFollowUpReminders] = useState(true);

  // Research & Intelligence
  const [webResearch, setWebResearch] = useState(true);
  const [marketAnalysis, setMarketAnalysis] = useState(false);
  const [competitorTracking, setCompetitorTracking] = useState(false);
  const [newsMonitoring, setNewsMonitoring] = useState(true);

  // Communication & Outreach
  const [emailDrafting, setEmailDrafting] = useState(true);
  const [meetingScheduling, setMeetingScheduling] = useState(true);
  const [contactManagement, setContactManagement] = useState(true);
  const [socialMediaMonitoring, setSocialMediaMonitoring] = useState(false);

  // Intelligence Levels
  const [creativityLevel, setCreativityLevel] = useState(0.7);
  const [formalityLevel, setFormalityLevel] = useState(0.5);
  const [proactivityLevel, setProactivityLevel] = useState(0.8);

  // Load existing settings on mount
  useEffect(() => {
    loadUserProfile();
    loadSettings();
  }, []);

  // Refresh user profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 AI Assistant Screen focused - refreshing profile');
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      const profile = await ApiService.getProfile();
      console.log('🔄 Refreshed user profile:', {
        assistantName: profile.assistantName,
        assistantProfileImage: profile.assistantProfileImage,
        name: profile.name,
        preferredName: profile.preferredName
      });
      // Update Redux store with fresh profile data
      dispatch(setUser(profile));
    } catch (error: any) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await ApiService.getAIAssistantSettings();

      if (settings) {
        // Core AI
        if (settings.coreAI) {
          setProactiveMode(settings.coreAI.proactiveMode ?? true);
          setSmartSuggestions(settings.coreAI.smartSuggestions ?? true);
          setContextAwareness(settings.coreAI.contextAwareness ?? true);
          setLearningMode(settings.coreAI.learningMode ?? true);
          setVoiceCommands(settings.coreAI.voiceCommands ?? true);
        }

        // Task Management
        if (settings.taskManagement) {
          setAutoScheduling(settings.taskManagement.autoScheduling ?? true);
          setPriorityIntelligence(settings.taskManagement.priorityIntelligence ?? true);
          setDeadlineTracking(settings.taskManagement.deadlineTracking ?? true);
          setFollowUpReminders(settings.taskManagement.followUpReminders ?? true);
        }

        // Research
        if (settings.research) {
          setWebResearch(settings.research.webResearch ?? true);
          setMarketAnalysis(settings.research.marketAnalysis ?? false);
          setCompetitorTracking(settings.research.competitorTracking ?? false);
          setNewsMonitoring(settings.research.newsMonitoring ?? true);
        }

        // Communication
        if (settings.communication) {
          setEmailDrafting(settings.communication.emailDrafting ?? true);
          setMeetingScheduling(settings.communication.meetingScheduling ?? true);
          setContactManagement(settings.communication.contactManagement ?? true);
          setSocialMediaMonitoring(settings.communication.socialMediaMonitoring ?? false);
        }

        // Intelligence Levels
        if (settings.intelligenceLevels) {
          setCreativityLevel(settings.intelligenceLevels.creativityLevel ?? 0.7);
          setFormalityLevel(settings.intelligenceLevels.formalityLevel ?? 0.5);
          setProactivityLevel(settings.intelligenceLevels.proactivityLevel ?? 0.8);
        }
      }
    } catch (error: any) {
      console.error('Failed to load AI Assistant settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (category: string, setting: string, value: boolean, setter: (value: boolean) => void) => {
    try {
      setSaving(true);
      setter(value);
      await ApiService.toggleAIAssistantSetting(category, setting, value);
    } catch (error: any) {
      console.error('Failed to toggle setting:', error);
      setter(!value); // Revert on error
      Alert.alert('Error', 'Failed to save setting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const coreAISettings = [
    {
      title: 'Proactive Mode',
      subtitle: 'AI suggests actions and opportunities proactively',
      value: proactiveMode,
      onValueChange: (value: boolean) => handleToggleSetting('coreAI', 'proactiveMode', value, setProactiveMode),
      icon: 'flash-outline',
      settingKey: 'proactiveMode'
    },
    {
      title: 'Smart Suggestions',
      subtitle: 'Intelligent recommendations based on your patterns',
      value: smartSuggestions,
      onValueChange: (value: boolean) => handleToggleSetting('coreAI', 'smartSuggestions', value, setSmartSuggestions),
      icon: 'bulb-outline',
      settingKey: 'smartSuggestions'
    },
    {
      title: 'Context Awareness',
      subtitle: 'Understands context from previous conversations',
      value: contextAwareness,
      onValueChange: (value: boolean) => handleToggleSetting('coreAI', 'contextAwareness', value, setContextAwareness),
      icon: 'eye-outline',
      settingKey: 'contextAwareness'
    },
    {
      title: 'Continuous Learning',
      subtitle: 'Learns from your preferences and behavior',
      value: learningMode,
      onValueChange: (value: boolean) => handleToggleSetting('coreAI', 'learningMode', value, setLearningMode),
      icon: 'school-outline',
      settingKey: 'learningMode'
    },
    {
      title: 'Voice Commands',
      subtitle: 'Accept and process voice instructions',
      value: voiceCommands,
      onValueChange: (value: boolean) => handleToggleSetting('coreAI', 'voiceCommands', value, setVoiceCommands),
      icon: 'mic-outline',
      settingKey: 'voiceCommands'
    },
  ];

  const taskManagementSettings = [
    {
      title: 'Auto Scheduling',
      subtitle: 'Automatically schedule tasks and meetings',
      value: autoScheduling,
      onValueChange: (value: boolean) => handleToggleSetting('taskManagement', 'autoScheduling', value, setAutoScheduling),
      icon: 'calendar-outline',
      settingKey: 'autoScheduling'
    },
    {
      title: 'Priority Intelligence',
      subtitle: 'Smart task prioritization based on importance',
      value: priorityIntelligence,
      onValueChange: (value: boolean) => handleToggleSetting('taskManagement', 'priorityIntelligence', value, setPriorityIntelligence),
      icon: 'flag-outline',
      settingKey: 'priorityIntelligence'
    },
    {
      title: 'Deadline Tracking',
      subtitle: 'Monitor and alert on approaching deadlines',
      value: deadlineTracking,
      onValueChange: (value: boolean) => handleToggleSetting('taskManagement', 'deadlineTracking', value, setDeadlineTracking),
      icon: 'time-outline',
      settingKey: 'deadlineTracking'
    },
    {
      title: 'Follow-up Reminders',
      subtitle: 'Automatic follow-ups on pending items',
      value: followUpReminders,
      onValueChange: (value: boolean) => handleToggleSetting('taskManagement', 'followUpReminders', value, setFollowUpReminders),
      icon: 'repeat-outline',
      settingKey: 'followUpReminders'
    },
  ];

  const researchSettings = [
    {
      title: 'Web Research',
      subtitle: 'Research information and provide insights',
      value: webResearch,
      onValueChange: (value: boolean) => handleToggleSetting('research', 'webResearch', value, setWebResearch),
      icon: 'search-outline',
      settingKey: 'webResearch'
    },
    {
      title: 'Market Analysis',
      subtitle: 'Monitor market trends and opportunities',
      value: marketAnalysis,
      onValueChange: (value: boolean) => handleToggleSetting('research', 'marketAnalysis', value, setMarketAnalysis),
      icon: 'trending-up-outline',
      settingKey: 'marketAnalysis'
    },
    {
      title: 'Competitor Tracking',
      subtitle: 'Track competitor activities and news',
      value: competitorTracking,
      onValueChange: (value: boolean) => handleToggleSetting('research', 'competitorTracking', value, setCompetitorTracking),
      icon: 'telescope-outline',
      settingKey: 'competitorTracking'
    },
    {
      title: 'News Monitoring',
      subtitle: 'Monitor relevant news and industry updates',
      value: newsMonitoring,
      onValueChange: (value: boolean) => handleToggleSetting('research', 'newsMonitoring', value, setNewsMonitoring),
      icon: 'newspaper-outline',
      settingKey: 'newsMonitoring'
    },
  ];

  const communicationSettings = [
    {
      title: 'Email Drafting',
      subtitle: 'Help draft professional emails and responses',
      value: emailDrafting,
      onValueChange: (value: boolean) => handleToggleSetting('communication', 'emailDrafting', value, setEmailDrafting),
      icon: 'mail-outline',
      settingKey: 'emailDrafting'
    },
    {
      title: 'Meeting Scheduling',
      subtitle: 'Schedule meetings with contacts automatically',
      value: meetingScheduling,
      onValueChange: (value: boolean) => handleToggleSetting('communication', 'meetingScheduling', value, setMeetingScheduling),
      icon: 'people-outline',
      settingKey: 'meetingScheduling'
    },
    {
      title: 'Contact Management',
      subtitle: 'Organize and manage professional contacts',
      value: contactManagement,
      onValueChange: (value: boolean) => handleToggleSetting('communication', 'contactManagement', value, setContactManagement),
      icon: 'person-circle-outline',
      settingKey: 'contactManagement'
    },
    {
      title: 'Social Media Monitoring',
      subtitle: 'Monitor mentions and relevant social activity',
      value: socialMediaMonitoring,
      onValueChange: (value: boolean) => handleToggleSetting('communication', 'socialMediaMonitoring', value, setSocialMediaMonitoring),
      icon: 'logo-twitter',
      settingKey: 'socialMediaMonitoring'
    },
  ];

  const aiCapabilities = [
    {
      title: 'Research & Analysis',
      subtitle: 'Deep web research, market analysis, competitor intelligence',
      icon: 'analytics-outline',
      type: 'research',
      action: () => (navigation as any).navigate('SpecializedCapability', { type: 'research' })
    },
    {
      title: 'Deal Finding',
      subtitle: 'Find best offers, negotiate deals, compare prices',
      icon: 'pricetag-outline',
      type: 'deals',
      action: () => (navigation as any).navigate('SpecializedCapability', { type: 'deals' })
    },
    {
      title: 'Travel Planning',
      subtitle: 'Plan trips, book flights, find accommodations',
      icon: 'airplane-outline',
      type: 'travel',
      action: () => (navigation as any).navigate('SpecializedCapability', { type: 'travel' })
    },
    {
      title: 'Document Processing',
      subtitle: 'Analyze documents, extract insights, create summaries',
      icon: 'document-text-outline',
      type: 'documents',
      action: () => (navigation as any).navigate('SpecializedCapability', { type: 'documents' })
    },
    {
      title: 'Financial Monitoring',
      subtitle: 'Track expenses, monitor investments, budget analysis',
      icon: 'card-outline',
      type: 'financial',
      action: () => (navigation as any).navigate('SpecializedCapability', { type: 'financial' })
    },
    {
      title: 'Event Planning',
      subtitle: 'Organize events, coordinate logistics, manage RSVPs',
      icon: 'calendar-number-outline',
      type: 'events',
      action: () => (navigation as any).navigate('SpecializedCapability', { type: 'events' })
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#C9A96E" />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{user?.assistantName || 'Assistant'}</Text>
          <View style={styles.headerRight} />
        </View>

        {/* AI Overview */}
        <View style={[styles.overviewCard, { backgroundColor: theme.surface }]}>
          <View style={styles.overviewIcon}>
            {user?.assistantProfileImage ? (
              <Image
                source={{ uri: user.assistantProfileImage }}
                style={styles.profileImage}
                onError={() => console.log('Image failed to load')}
              />
            ) : (
              <Ionicons name="person-circle" size={32} color="#C9A96E" />
            )}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => (navigation as any).navigate('AssistantProfileImage')}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.overviewTitle, { color: theme.text }]}>
            {user?.assistantName || 'Assistant'}
          </Text>
          <Text style={[styles.overviewSubtitle, { color: theme.textSecondary }]}>
            Configure your personal assistant's capabilities, intelligence levels, and specialized features
          </Text>
        </View>

        {/* Core AI Settings */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CORE AI CAPABILITIES</Text>
          {coreAISettings.map((setting, index) => (
            <View
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === coreAISettings.length - 1 && styles.lastItem
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.15)' }]}>
                  <Ionicons name={setting.icon as any} size={20} color="#C9A96E" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {setting.title}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    {setting.subtitle}
                  </Text>
                </View>
              </View>
              <Switch
                value={setting.value}
                onValueChange={setting.onValueChange}
                trackColor={{ false: theme.border, true: '#C9A96E' }}
                thumbColor={setting.value ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor={theme.border}
                disabled={saving}
              />
            </View>
          ))}
        </View>

        {/* AI Intelligence Levels */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>AI PERSONALITY & BEHAVIOR</Text>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={() => (navigation as any).navigate('AgentCreativity')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.15)' }]}>
                <Ionicons name="brush-outline" size={20} color="#C9A96E" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Creativity Level
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  {creativityLevel < 0.3 ? 'Conservative' : creativityLevel > 0.7 ? 'Creative' : 'Balanced'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={() => (navigation as any).navigate('AgentCommunicationStyle')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.15)' }]}>
                <Ionicons name="chatbubble-outline" size={20} color="#C9A96E" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Communication Style
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  {formalityLevel < 0.3 ? 'Casual' : formalityLevel > 0.7 ? 'Professional' : 'Balanced'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, styles.lastItem]}
            onPress={() => (navigation as any).navigate('AgentProactivity')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.15)' }]}>
                <Ionicons name="trending-up-outline" size={20} color="#C9A96E" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Proactivity Level
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  {proactivityLevel < 0.3 ? 'Reactive' : proactivityLevel > 0.7 ? 'Highly Proactive' : 'Moderately Proactive'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Task Management */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TASK MANAGEMENT</Text>
          {taskManagementSettings.map((setting, index) => (
            <View
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === taskManagementSettings.length - 1 && styles.lastItem
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.15)' }]}>
                  <Ionicons name={setting.icon as any} size={20} color="#C9A96E" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {setting.title}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    {setting.subtitle}
                  </Text>
                </View>
              </View>
              <Switch
                value={setting.value}
                onValueChange={setting.onValueChange}
                trackColor={{ false: theme.border, true: '#C9A96E' }}
                thumbColor={setting.value ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor={theme.border}
                disabled={saving}
              />
            </View>
          ))}
        </View>

        {/* Research & Intelligence */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>RESEARCH & INTELLIGENCE</Text>
          {researchSettings.map((setting, index) => (
            <View
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === researchSettings.length - 1 && styles.lastItem
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.15)' }]}>
                  <Ionicons name={setting.icon as any} size={20} color="#C9A96E" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {setting.title}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    {setting.subtitle}
                  </Text>
                </View>
              </View>
              <Switch
                value={setting.value}
                onValueChange={setting.onValueChange}
                trackColor={{ false: theme.border, true: '#C9A96E' }}
                thumbColor={setting.value ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor={theme.border}
                disabled={saving}
              />
            </View>
          ))}
        </View>

        {/* Communication & Outreach */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>COMMUNICATION & OUTREACH</Text>
          {communicationSettings.map((setting, index) => (
            <View
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === communicationSettings.length - 1 && styles.lastItem
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.15)' }]}>
                  <Ionicons name={setting.icon as any} size={20} color="#C9A96E" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {setting.title}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    {setting.subtitle}
                  </Text>
                </View>
              </View>
              <Switch
                value={setting.value}
                onValueChange={setting.onValueChange}
                trackColor={{ false: theme.border, true: '#C9A96E' }}
                thumbColor={setting.value ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor={theme.border}
                disabled={saving}
              />
            </View>
          ))}
        </View>

        {/* AI Capabilities */}
        <View style={[styles.section, { backgroundColor: theme.surface, marginBottom: 20 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SPECIALIZED CAPABILITIES</Text>
          {aiCapabilities.map((capability, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === aiCapabilities.length - 1 && styles.lastItem
              ]}
              onPress={capability.action}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.15)' }]}>
                  <Ionicons name={capability.icon as any} size={20} color="#C9A96E" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {capability.title}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    {capability.subtitle}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 48,
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  overviewCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  overviewIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  editButton: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C9A96E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  overviewSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

export default AIAssistantScreen;
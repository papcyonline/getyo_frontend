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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import ApiService from '../services/api';

const { height } = Dimensions.get('window');

type AgentTaskCategoriesNavigationProp = StackNavigationProp<RootStackParamList, 'AgentTaskCategories'>;

interface TaskCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  examples: string[];
  selected: boolean;
}

interface PriorityLevel {
  id: string;
  label: string;
  description: string;
  color: string;
  selected: boolean;
}

const taskCategories: TaskCategory[] = [
  {
    id: 'scheduling',
    name: 'Scheduling & Calendar',
    description: 'Manage appointments and meetings',
    icon: 'event',
    priority: 'high',
    examples: ['Book meetings', 'Set reminders', 'Calendar management'],
    selected: false
  },
  {
    id: 'email_management',
    name: 'Email Management',
    description: 'Handle emails and communication',
    icon: 'email',
    priority: 'high',
    examples: ['Draft emails', 'Respond to messages', 'Email organization'],
    selected: false
  },
  {
    id: 'research',
    name: 'Research & Information',
    description: 'Find information and conduct research',
    icon: 'search',
    priority: 'medium',
    examples: ['Web research', 'Data analysis', 'Report generation'],
    selected: false
  },
  {
    id: 'reminders',
    name: 'Reminders & Alerts',
    description: 'Set up and manage reminders',
    icon: 'alarm',
    priority: 'high',
    examples: ['Task reminders', 'Meeting alerts', 'Follow-up notifications'],
    selected: false
  },
  {
    id: 'travel_planning',
    name: 'Travel Planning',
    description: 'Plan trips and manage travel',
    icon: 'flight',
    priority: 'low',
    examples: ['Flight booking', 'Hotel reservations', 'Itinerary planning'],
    selected: false
  },
  {
    id: 'document_management',
    name: 'Document Management',
    description: 'Organize and manage documents',
    icon: 'folder',
    priority: 'medium',
    examples: ['File organization', 'Document creation', 'Content management'],
    selected: false
  },
  {
    id: 'social_media',
    name: 'Social Media',
    description: 'Manage social media presence',
    icon: 'share',
    priority: 'low',
    examples: ['Post scheduling', 'Content creation', 'Social engagement'],
    selected: false
  },
  {
    id: 'finance_tracking',
    name: 'Finance Tracking',
    description: 'Track expenses and financial planning',
    icon: 'account-balance-wallet',
    priority: 'medium',
    examples: ['Expense tracking', 'Budget planning', 'Bill reminders'],
    selected: false
  },
];

const priorityLevels: PriorityLevel[] = [
  {
    id: 'immediate',
    label: 'Immediate',
    description: 'Urgent tasks requiring instant attention',
    color: '#FF6B6B',
    selected: false
  },
  {
    id: 'daily',
    label: 'Daily',
    description: 'Important daily tasks and reminders',
    color: '#000000',
    selected: true
  },
  {
    id: 'weekly',
    label: 'Weekly',
    description: 'Weekly planning and check-ins',
    color: '#4ECDC4',
    selected: false
  },
  {
    id: 'monthly',
    label: 'Monthly',
    description: 'Long-term goals and monthly reviews',
    color: '#95A5A6',
    selected: false
  },
];

const AgentTaskCategoriesScreen: React.FC = () => {
  const navigation = useNavigation<AgentTaskCategoriesNavigationProp>();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [selectedCategories, setSelectedCategories] = useState<TaskCategory[]>(
    taskCategories.filter(category => category.selected)
  );
  const [selectedPriorities, setSelectedPriorities] = useState<PriorityLevel[]>(
    priorityLevels.filter(priority => priority.selected)
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<TaskCategory[]>(taskCategories);

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

      // Set available categories to our local definitions
      setAvailableCategories(taskCategories);

      // Load existing configuration
      const existingConfig = await ApiService.getAgentConfiguration();
      if (existingConfig?.taskCategories?.enabledCategories) {
        const enabledCategories = existingConfig.taskCategories.enabledCategories;
        const selected = taskCategories.filter(cat => enabledCategories.includes(cat.id));
        setSelectedCategories(selected);

        // Update the available categories to reflect current selection state
        const updatedCategories = taskCategories.map(cat => ({
          ...cat,
          selected: enabledCategories.includes(cat.id)
        }));
        setAvailableCategories(updatedCategories);
      }
    } catch (error: any) {
      console.error('Failed to load existing task categories configuration:', error);
      // Don't show error for first-time users, just use defaults
      setAvailableCategories(taskCategories);
    } finally {
      setLoading(false);
    }
  };

  const getIconForCategory = (categoryId: string): string => {
    const iconMap: { [key: string]: string } = {
      scheduling: 'event',
      email_management: 'email',
      research: 'search',
      reminders: 'alarm',
      travel_planning: 'flight',
      document_management: 'folder',
      social_media: 'share',
      finance_tracking: 'account-balance-wallet',
    };
    return iconMap[categoryId] || 'category';
  };

  const handleCategoryToggle = (categoryId: string) => {
    const category = availableCategories.find(c => c.id === categoryId);
    if (!category) return;

    setSelectedCategories(prev => {
      const isCurrentlySelected = prev.some(c => c.id === categoryId);

      if (isCurrentlySelected) {
        return prev.filter(c => c.id !== categoryId);
      } else {
        return [...prev, category];
      }
    });
  };

  const handlePriorityToggle = (priorityId: string) => {
    const priority = priorityLevels.find(p => p.id === priorityId);
    if (!priority) return;

    setSelectedPriorities(prev => {
      const isCurrentlySelected = prev.some(p => p.id === priorityId);

      if (isCurrentlySelected) {
        return prev.filter(p => p.id !== priorityId);
      } else {
        return [...prev, priority];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one task category to continue.');
      return;
    }

    try {
      setSaving(true);

      // Map selected categories and priorities to backend format
      const enabledCategories = selectedCategories.map(cat => cat.id);

      // Create priority order based on category priorities
      const priorityOrder = selectedCategories
        .sort((a, b) => {
          const priorityValue = { high: 3, medium: 2, low: 1 };
          return (priorityValue[b.priority as keyof typeof priorityValue] || 0) -
                 (priorityValue[a.priority as keyof typeof priorityValue] || 0);
        })
        .map(cat => cat.id);

      const taskCategoriesData = {
        enabledCategories,
        priorityOrder: priorityOrder.length > 0 ? priorityOrder : enabledCategories, // Fallback to enabled categories
      };

      // Save task categories preferences to backend
      await ApiService.updateAgentTaskCategories(taskCategoriesData);

      console.log('✅ Task categories preferences saved successfully');

      // Navigate to next screen
      navigation.navigate('AgentLearning');
    } catch (error: any) {
      console.error('❌ Failed to save task categories preferences:', error);
      Alert.alert(
        'Save Failed',
        'Unable to save your task category preferences. Please try again.',
        [
          { text: 'Retry', onPress: handleContinue },
          { text: 'Skip for now', onPress: () => navigation.navigate('AgentLearning') },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isCategorySelected = (categoryId: string) => {
    return selectedCategories.some(c => c.id === categoryId);
  };

  const isPrioritySelected = (priorityId: string) => {
    return selectedPriorities.some(p => p.id === priorityId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFFFFF';
      case 'low': return '#95A5A6';
      default: return '#95A5A6';
    }
  };

  const renderTaskCategory = (category: TaskCategory, index: number) => {
    const isSelected = isCategorySelected(category.id);
    const isLast = index === taskCategories.length - 1;

    return (
      <View key={category.id}>
        <TouchableOpacity
          style={[styles.categoryItem, isSelected && styles.selectedItem]}
          onPress={() => handleCategoryToggle(category.id)}
          activeOpacity={0.7}
        >
          <View style={styles.itemContent}>
            <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
              <MaterialIcons
                name={category.icon as any}
                size={24}
                color={isSelected ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
            <View style={styles.textContainer}>
              <View style={styles.nameRow}>
                <Text style={[styles.categoryName, isSelected && styles.selectedText]}>
                  {category.name}
                </Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(category.priority) }]}>
                  <Text style={styles.priorityText}>
                    {category.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.categoryDescription, isSelected && styles.selectedDescription]}>
                {category.description}
              </Text>
              <View style={styles.examplesContainer}>
                {category.examples.slice(0, 2).map((example, index) => (
                  <Text key={index} style={[styles.exampleText, isSelected && styles.selectedExample]}>
                    • {example}
                  </Text>
                ))}
              </View>
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

  const renderPriorityLevel = (priority: PriorityLevel, index: number) => {
    const isSelected = isPrioritySelected(priority.id);
    const isLast = index === priorityLevels.length - 1;

    return (
      <View key={priority.id}>
        <TouchableOpacity
          style={[styles.priorityItem, isSelected && styles.selectedPriorityItem]}
          onPress={() => handlePriorityToggle(priority.id)}
          activeOpacity={0.7}
        >
          <View style={styles.priorityContent}>
            <View style={[styles.priorityIndicator, { backgroundColor: priority.color }]} />
            <View style={styles.priorityTextContainer}>
              <Text style={[styles.priorityLabel, isSelected && styles.selectedText]}>
                {priority.label}
              </Text>
              <Text style={[styles.priorityDescription, isSelected && styles.selectedDescription]}>
                {priority.description}
              </Text>
            </View>
            {isSelected && (
              <View style={styles.checkmarkContainer}>
                <MaterialIcons name="check-circle" size={18} color="#FFFFFF" />
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
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(0, 0, 0, 0.8)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />


      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Task Categories & Priorities</Text>
          <Text style={styles.subtitle}>
            Choose the types of tasks you want your assistant to handle
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
              <Text style={styles.step}>Task Categories</Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3396D3" />
                  <Text style={styles.loadingText}>Loading task categories...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.selectionInfo}>
                    <Text style={styles.infoText}>
                      Categories: {selectedCategories.length}/{availableCategories.length}
                    </Text>
                    <Text style={styles.infoSubtext}>
                      Select the task categories your assistant should prioritize
                    </Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Task Categories</Text>
                    <View style={styles.categoriesList}>
                      {availableCategories.map((category, index) => renderTaskCategory(category, index))}
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Priority Levels</Text>
                    <Text style={styles.sectionDescription}>
                      How should your assistant prioritize different types of tasks?
                    </Text>
                    <View style={styles.prioritiesList}>
                      {priorityLevels.map((priority, index) => renderPriorityLevel(priority, index))}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (selectedCategories.length === 0 || saving) && styles.disabledButton
                ]}
                onPress={handleContinue}
                disabled={selectedCategories.length === 0 || saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <View style={styles.savingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.continueButtonText}>Saving...</Text>
                  </View>
                ) : (
                  <Text style={[
                    styles.continueButtonText,
                    selectedCategories.length === 0 && styles.disabledButtonText
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: 'rgba(255, 255, 255, 0.6)',
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
  categoriesList: {
    paddingHorizontal: 10,
  },
  categoryItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  selectedItem: {
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    borderRadius: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  priorityBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
    marginBottom: 8,
  },
  selectedDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  examplesContainer: {
    marginTop: 4,
  },
  exampleText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 16,
  },
  selectedExample: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  checkmarkContainer: {
    marginLeft: 12,
    marginTop: 12,
  },
  prioritiesList: {
    paddingHorizontal: 10,
  },
  priorityItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  selectedPriorityItem: {
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    borderRadius: 12,
  },
  priorityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  priorityTextContainer: {
    flex: 1,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  priorityDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
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
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AgentTaskCategoriesScreen;
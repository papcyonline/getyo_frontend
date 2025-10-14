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
  Switch,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

type SpecializedCapabilityRouteProp = RouteProp<RootStackParamList, 'SpecializedCapability'>;
type SpecializedCapabilityNavigationProp = StackNavigationProp<RootStackParamList, 'SpecializedCapability'>;

interface CapabilityConfig {
  title: string;
  icon: string;
  description: string;
  features: {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
  }[];
  tips: string[];
}

const capabilityConfigs: Record<string, CapabilityConfig> = {
  research: {
    title: 'Research & Analysis',
    icon: 'analytics-outline',
    description: 'Configure how your assistant conducts research and analyzes information',
    features: [
      {
        id: 'web_search',
        title: 'Web Search',
        description: 'Search the web for latest information',
        enabled: true,
      },
      {
        id: 'data_analysis',
        title: 'Data Analysis',
        description: 'Analyze data and provide insights',
        enabled: true,
      },
      {
        id: 'competitor_research',
        title: 'Competitor Research',
        description: 'Track and analyze competitor activities',
        enabled: false,
      },
      {
        id: 'market_trends',
        title: 'Market Trends',
        description: 'Monitor market trends and opportunities',
        enabled: true,
      },
    ],
    tips: [
      'Research results are automatically saved to your documents',
      'Your assistant can schedule recurring research tasks',
      'Set alerts for specific topics or competitors',
    ],
  },
  deals: {
    title: 'Deal Finding',
    icon: 'pricetag-outline',
    description: 'Configure how your assistant finds and negotiates deals',
    features: [
      {
        id: 'price_comparison',
        title: 'Price Comparison',
        description: 'Compare prices across multiple sources',
        enabled: true,
      },
      {
        id: 'deal_alerts',
        title: 'Deal Alerts',
        description: 'Get notified about relevant deals',
        enabled: true,
      },
      {
        id: 'auto_negotiation',
        title: 'Auto Negotiation',
        description: 'Automatically negotiate better prices',
        enabled: false,
      },
      {
        id: 'discount_hunting',
        title: 'Discount Hunting',
        description: 'Find coupons and discount codes',
        enabled: true,
      },
    ],
    tips: [
      'Set budget limits for automatic deal monitoring',
      'Your assistant can track price history',
      'Enable notifications for price drops on saved items',
    ],
  },
  travel: {
    title: 'Travel Planning',
    icon: 'airplane-outline',
    description: 'Configure how your assistant plans and manages travel',
    features: [
      {
        id: 'flight_search',
        title: 'Flight Search',
        description: 'Find and compare flight options',
        enabled: true,
      },
      {
        id: 'hotel_booking',
        title: 'Hotel Booking',
        description: 'Search and book accommodations',
        enabled: true,
      },
      {
        id: 'itinerary_planning',
        title: 'Itinerary Planning',
        description: 'Create detailed travel itineraries',
        enabled: true,
      },
      {
        id: 'travel_alerts',
        title: 'Travel Alerts',
        description: 'Monitor flight status and delays',
        enabled: true,
      },
    ],
    tips: [
      'Your preferences are saved for future trips',
      'Assistant can track loyalty programs and points',
      'Automatic check-in reminders for flights',
    ],
  },
  documents: {
    title: 'Document Processing',
    icon: 'document-text-outline',
    description: 'Configure how your assistant handles documents',
    features: [
      {
        id: 'document_analysis',
        title: 'Document Analysis',
        description: 'Extract insights from documents',
        enabled: true,
      },
      {
        id: 'summarization',
        title: 'Summarization',
        description: 'Create summaries of long documents',
        enabled: true,
      },
      {
        id: 'translation',
        title: 'Translation',
        description: 'Translate documents to other languages',
        enabled: false,
      },
      {
        id: 'ocr',
        title: 'OCR Processing',
        description: 'Extract text from images and scans',
        enabled: true,
      },
    ],
    tips: [
      'Supports PDF, Word, Excel, and image files',
      'Processed documents are encrypted and secure',
      'Set up automatic document workflows',
    ],
  },
  financial: {
    title: 'Financial Monitoring',
    icon: 'card-outline',
    description: 'Configure how your assistant tracks finances',
    features: [
      {
        id: 'expense_tracking',
        title: 'Expense Tracking',
        description: 'Track and categorize expenses',
        enabled: true,
      },
      {
        id: 'budget_alerts',
        title: 'Budget Alerts',
        description: 'Get alerts when approaching limits',
        enabled: true,
      },
      {
        id: 'investment_monitoring',
        title: 'Investment Monitoring',
        description: 'Track investment performance',
        enabled: false,
      },
      {
        id: 'bill_reminders',
        title: 'Bill Reminders',
        description: 'Never miss a payment',
        enabled: true,
      },
    ],
    tips: [
      'Connect your bank accounts for automatic tracking',
      'Set monthly budget goals by category',
      'Receive weekly financial summaries',
    ],
  },
  events: {
    title: 'Event Planning',
    icon: 'calendar-number-outline',
    description: 'Configure how your assistant manages events',
    features: [
      {
        id: 'event_coordination',
        title: 'Event Coordination',
        description: 'Coordinate logistics and schedules',
        enabled: true,
      },
      {
        id: 'rsvp_management',
        title: 'RSVP Management',
        description: 'Track guest responses',
        enabled: true,
      },
      {
        id: 'vendor_booking',
        title: 'Vendor Booking',
        description: 'Find and book event vendors',
        enabled: false,
      },
      {
        id: 'reminder_system',
        title: 'Reminder System',
        description: 'Automated reminders for attendees',
        enabled: true,
      },
    ],
    tips: [
      'Import guest lists from your contacts',
      'Automatic follow-ups with non-responders',
      'Generate event timelines and checklists',
    ],
  },
};

const SpecializedCapabilityScreen: React.FC = () => {
  const navigation = useNavigation<SpecializedCapabilityNavigationProp>();
  const route = useRoute<SpecializedCapabilityRouteProp>();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(height)).current;

  const capabilityType = route.params?.type || 'research';
  const config = capabilityConfigs[capabilityType];

  const [features, setFeatures] = useState(config.features);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, []);

  useEffect(() => {
    // Check if any feature has changed
    const changed = features.some((feature, index) =>
      feature.enabled !== config.features[index].enabled
    );
    setHasChanges(changed);
  }, [features]);

  const handleToggleFeature = (featureId: string) => {
    setFeatures(prevFeatures =>
      prevFeatures.map(feature =>
        feature.id === featureId
          ? { ...feature, enabled: !feature.enabled }
          : feature
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Call API to save specialized capability settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Capability settings updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Failed to update capability settings:', error);
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.description}</Text>
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
              <Text style={styles.step}>Specialized Capability</Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Capability Icon */}
              <View style={styles.iconSection}>
                <View style={styles.largeIconContainer}>
                  <Ionicons name={config.icon as any} size={64} color="#C9A96E" />
                </View>
              </View>

              {/* Features Section */}
              <View style={styles.featuresSection}>
                <Text style={styles.sectionTitle}>Features</Text>
                {features.map((feature, index) => (
                  <View
                    key={feature.id}
                    style={[
                      styles.featureItem,
                      index === features.length - 1 && styles.lastFeatureItem
                    ]}
                  >
                    <View style={styles.featureLeft}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                    <Switch
                      value={feature.enabled}
                      onValueChange={() => handleToggleFeature(feature.id)}
                      trackColor={{ false: 'rgba(255, 247, 245, 0.2)', true: '#C9A96E' }}
                      thumbColor={feature.enabled ? '#FFFFFF' : '#f4f3f4'}
                      ios_backgroundColor="rgba(255, 247, 245, 0.2)"
                      disabled={saving}
                    />
                  </View>
                ))}
              </View>

              {/* Tips Section */}
              <View style={styles.tipsSection}>
                <View style={styles.tipHeader}>
                  <Ionicons name="bulb" size={20} color="#C9A96E" />
                  <Text style={styles.tipsTitle}>Tips & Best Practices</Text>
                </View>
                {config.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#C9A96E" />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
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
  iconSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  largeIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(201, 169, 110, 0.3)',
  },
  featuresSection: {
    backgroundColor: 'rgba(255, 247, 245, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C9A96E',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 247, 245, 0.1)',
  },
  lastFeatureItem: {
    borderBottomWidth: 0,
  },
  featureLeft: {
    flex: 1,
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF7F5',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255, 247, 245, 0.6)',
    lineHeight: 18,
  },
  tipsSection: {
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.2)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C9A96E',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.7)',
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

export default SpecializedCapabilityScreen;

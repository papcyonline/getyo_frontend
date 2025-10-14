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

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import ApiService from '../services/api';

const { height } = Dimensions.get('window');

type AgentAvailabilityNavigationProp = StackNavigationProp<RootStackParamList, 'AgentAvailability'>;

interface TimeSlot {
  id: string;
  label: string;
  time: string;
  selected: boolean;
}

interface AvailabilitySettings {
  alwaysAvailable: boolean;
  workingHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  timeZone: string;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  weekends: boolean;
  urgentOnly: boolean;
}

const defaultTimeSlots: TimeSlot[] = [
  { id: 'early_morning', label: 'Early Morning', time: '6:00 - 9:00 AM', selected: false },
  { id: 'morning', label: 'Morning', time: '9:00 AM - 12:00 PM', selected: true },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 - 6:00 PM', selected: true },
  { id: 'evening', label: 'Evening', time: '6:00 - 9:00 PM', selected: false },
  { id: 'night', label: 'Night', time: '9:00 PM - 12:00 AM', selected: false },
];

const AgentAvailabilityScreen: React.FC = () => {
  const navigation = useNavigation<AgentAvailabilityNavigationProp>();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(height)).current;

  const [settings, setSettings] = useState<AvailabilitySettings>({
    alwaysAvailable: false,
    workingHours: {
      enabled: true,
      start: '9:00 AM',
      end: '6:00 PM'
    },
    timeZone: 'Auto-detect',
    quietHours: {
      enabled: false,
      start: '10:00 PM',
      end: '7:00 AM'
    },
    weekends: false,
    urgentOnly: false
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(defaultTimeSlots);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
      if (existingConfig?.availability) {
        const availability = existingConfig.availability;

        // Map backend availability to frontend settings
        setSettings(prev => ({
          ...prev,
          alwaysAvailable: availability.alwaysAvailable || false,
          workingHours: {
            enabled: availability.workingHours?.enabled || false,
            start: availability.workingHours?.startTime || '09:00',
            end: availability.workingHours?.endTime || '17:00'
          },
          quietHours: {
            enabled: availability.quietHours?.enabled || false,
            start: availability.quietHours?.startTime || '22:00',
            end: availability.quietHours?.endTime || '07:00'
          },
          weekends: availability.availableDays?.includes('saturday') && availability.availableDays?.includes('sunday') || false,
          urgentOnly: availability.urgentOnly || false,
          timeZone: availability.workingHours?.timezone || 'UTC'
        }));

        // Load preferred time slots if available
        if (availability.preferredTimeSlots && availability.preferredTimeSlots.length > 0) {
          setTimeSlots(availability.preferredTimeSlots);
        }
      }
    } catch (error: any) {
      console.error('Failed to load existing availability configuration:', error);
      // Don't show error for first-time users, just use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSettingToggle = (key: keyof AvailabilitySettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTimeSlotToggle = (slotId: string) => {
    setTimeSlots(prev =>
      prev.map(slot =>
        slot.id === slotId
          ? { ...slot, selected: !slot.selected }
          : slot
      )
    );
  };

  const handleContinue = async () => {
    try {
      setSaving(true);

      // Map frontend settings to backend format
      const availableDays = [];

      // Add weekdays
      availableDays.push('monday', 'tuesday', 'wednesday', 'thursday', 'friday');

      // Add weekends if enabled
      if (settings.weekends) {
        availableDays.push('saturday', 'sunday');
      }

      const availabilityData = {
        alwaysAvailable: settings.alwaysAvailable,
        workingHours: {
          enabled: settings.workingHours.enabled,
          startTime: settings.workingHours.start.replace(' AM', '').replace(' PM', ''),
          endTime: settings.workingHours.end.replace(' AM', '').replace(' PM', ''),
          timezone: settings.timeZone === 'Auto-detect' ? 'UTC' : settings.timeZone,
        },
        availableDays,
        quietHours: {
          enabled: settings.quietHours.enabled,
          startTime: settings.quietHours.start.replace(' PM', '').replace(' AM', ''),
          endTime: settings.quietHours.end.replace(' PM', '').replace(' AM', ''),
        },
        urgentOnly: settings.urgentOnly,
        preferredTimeSlots: timeSlots.map(slot => ({
          id: slot.id,
          label: slot.label,
          time: slot.time,
          selected: slot.selected
        })),
      };

      // Save availability preferences to backend
      await ApiService.updateAgentAvailability(availabilityData);

      console.log('✅ Availability preferences saved successfully');

      // Navigate to next screen
      navigation.navigate('AgentTaskCategories');
    } catch (error: any) {
      console.error('❌ Failed to save availability preferences:', error);
      Alert.alert(
        'Save Failed',
        'Unable to save your availability preferences. Please try again.',
        [
          { text: 'Retry', onPress: handleContinue },
          { text: 'Skip for now', onPress: () => navigation.navigate('AgentTaskCategories') },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderTimeSlot = (slot: TimeSlot, index: number) => {
    const isLast = index === timeSlots.length - 1;

    return (
      <View key={slot.id}>
        <TouchableOpacity
          style={[styles.timeSlotItem, slot.selected && styles.selectedTimeSlot]}
          onPress={() => handleTimeSlotToggle(slot.id)}
          activeOpacity={0.7}
        >
          <View style={styles.timeSlotContent}>
            <View style={styles.timeSlotInfo}>
              <Text style={[styles.timeSlotLabel, slot.selected && styles.selectedText]}>
                {slot.label}
              </Text>
              <Text style={[styles.timeSlotTime, slot.selected && styles.selectedTimeText]}>
                {slot.time}
              </Text>
            </View>
            <View style={[styles.checkbox, slot.selected && styles.selectedCheckbox]}>
              {slot.selected && (
                <MaterialIcons name="check" size={16} color="#FFF7F5" />
              )}
            </View>
          </View>
        </TouchableOpacity>
        {!isLast && <View style={styles.divider} />}
      </View>
    );
  };

  const renderSetting = (
    title: string,
    description: string,
    value: boolean,
    onToggle: () => void,
    icon: string,
    index: number,
    totalCount: number
  ) => {
    const isLast = index === totalCount - 1;

    return (
      <View key={`${title}-${index}`}>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <View style={styles.settingIcon}>
              <MaterialIcons name={icon as any} size={20} color="#FFF7F5" />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>{title}</Text>
              <Text style={styles.settingDescription}>{description}</Text>
            </View>
            <Switch
              value={value}
              onValueChange={onToggle}
              trackColor={{ false: 'rgba(255, 247, 245, 0.1)', true: '#3396D3' }}
              thumbColor={value ? '#FFF7F5' : 'rgba(255, 247, 245, 0.6)'}
              ios_backgroundColor="rgba(255, 247, 245, 0.1)"
            />
          </View>
        </View>
        {!isLast && <View style={styles.divider} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Availability & Preferences</Text>
          <Text style={styles.subtitle}>
            Set when your AI assistant should be active and how it responds
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
              <Text style={styles.step}>Availability Setup</Text>
              <TouchableOpacity style={styles.skipButton} onPress={handleContinue}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3396D3" />
                  <Text style={styles.loadingText}>Loading availability settings...</Text>
                </View>
              ) : (
                <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Availability Settings</Text>

                <View style={styles.settingsList}>
                  {renderSetting(
                    'Always Available',
                    'Your assistant responds 24/7',
                    settings.alwaysAvailable,
                    () => handleSettingToggle('alwaysAvailable'),
                    'access-time',
                    0,
                    4
                  )}

                  {renderSetting(
                    'Working Hours Only',
                    'Active during business hours',
                    settings.workingHours.enabled,
                    () => setSettings(prev => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, enabled: !prev.workingHours.enabled }
                    })),
                    'business',
                    1,
                    4
                  )}

                  {renderSetting(
                    'Quiet Hours',
                    'Reduced activity during rest time',
                    settings.quietHours.enabled,
                    () => setSettings(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled }
                    })),
                    'volume-off',
                    2,
                    4
                  )}

                  {renderSetting(
                    'Weekend Availability',
                    'Active on weekends',
                    settings.weekends,
                    () => handleSettingToggle('weekends'),
                    'weekend',
                    3,
                    4
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferred Time Slots</Text>
                <Text style={styles.sectionDescription}>
                  When would you like your assistant to be most active?
                </Text>

                <View style={styles.timeSlotsList}>
                  {timeSlots.map((slot, index) => renderTimeSlot(slot, index))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Response Preferences</Text>

                <View style={styles.settingsList}>
                  {renderSetting(
                    'Urgent Only Mode',
                    'Only respond to urgent requests',
                    settings.urgentOnly,
                    () => handleSettingToggle('urgentOnly'),
                    'priority-high',
                    0,
                    1
                  )}
                </View>
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
                    <ActivityIndicator size="small" color="#FFF7F5" style={{ marginRight: 8 }} />
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
  animatedContainer: {
    flex: 1,
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
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.2)',
  },
  skipButtonText: {
    color: '#FFF7F5',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF7F5',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.6)',
    marginBottom: 20,
    lineHeight: 20,
  },
  settingsList: {
    paddingHorizontal: 10,
  },
  settingItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    marginHorizontal: 4,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF7F5',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.6)',
    lineHeight: 18,
  },
  timeSlotsList: {
    paddingHorizontal: 10,
  },
  timeSlotItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  selectedTimeSlot: {
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    borderRadius: 12,
  },
  timeSlotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeSlotInfo: {
    flex: 1,
  },
  timeSlotLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 247, 245, 0.9)',
    marginBottom: 4,
  },
  selectedText: {
    color: '#FFF7F5',
  },
  timeSlotTime: {
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.6)',
  },
  selectedTimeText: {
    color: 'rgba(255, 247, 245, 0.9)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 247, 245, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#3396D3',
    borderColor: '#3396D3',
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
  continueButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF7F5',
    letterSpacing: 0.5,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
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

export default AgentAvailabilityScreen;
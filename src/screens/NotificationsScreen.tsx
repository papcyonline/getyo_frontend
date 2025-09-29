import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [meetingAlerts, setMeetingAlerts] = useState(true);
  const [voiceNotifications, setVoiceNotifications] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const notificationSettings = [
    {
      title: 'Push Notifications',
      subtitle: 'Receive notifications on your device',
      value: pushNotifications,
      onValueChange: setPushNotifications,
      icon: 'notifications-outline'
    },
    {
      title: 'Task Reminders',
      subtitle: 'Get reminded about upcoming tasks',
      value: taskReminders,
      onValueChange: setTaskReminders,
      icon: 'checkbox-outline'
    },
    {
      title: 'Meeting Alerts',
      subtitle: 'Alerts for scheduled meetings and events',
      value: meetingAlerts,
      onValueChange: setMeetingAlerts,
      icon: 'calendar-outline'
    },
    {
      title: 'Voice Notifications',
      subtitle: 'Audio announcements for important updates',
      value: voiceNotifications,
      onValueChange: setVoiceNotifications,
      icon: 'mic-outline'
    },
    {
      title: 'Daily Email Digest',
      subtitle: 'Daily summary of tasks and events via email',
      value: emailDigest,
      onValueChange: setEmailDigest,
      icon: 'mail-outline'
    },
    {
      title: 'Notification Sound',
      subtitle: 'Play sound for notifications',
      value: soundEnabled,
      onValueChange: setSoundEnabled,
      icon: 'volume-medium-outline'
    },
  ];

  return (
    <View style={styles.container}>
      {/* Blue-Black Gradient Background */}
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.15)', 'rgba(51, 150, 211, 0.05)', 'transparent']}
        style={styles.gradientBackground}
        start={{ x: 0.5, y: 0.6 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Notification Settings */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>NOTIFICATION PREFERENCES</Text>
          {notificationSettings.map((setting, index) => (
            <View
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === notificationSettings.length - 1 && styles.lastItem
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(21, 183, 232, 0.1)' }]}>
                  <Ionicons name={setting.icon as any} size={20} color="#FFFFFF" />
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
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: '#3396D3' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="rgba(255, 255, 255, 0.3)"
              />
            </View>
          ))}
        </View>

        {/* Quiet Hours */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>QUIET HOURS</Text>
          <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(21, 183, 232, 0.1)' }]}>
                <Ionicons name="moon-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Do Not Disturb
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  10:00 PM - 7:00 AM
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    zIndex: 1,
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
});

export default NotificationsScreen;
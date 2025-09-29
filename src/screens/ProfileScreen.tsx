import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState } from '../store';
import { toggleTheme } from '../store/slices/themeSlice';
import { Ionicons } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const isDark = useSelector((state: RootState) => state.theme.isDark);
  const user = useSelector((state: RootState) => state.user.user);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleBackPress = () => {
    navigation.navigate('Home');
  };

  const settingsItems = [
    { title: 'Notifications', icon: 'notifications-outline', action: () => navigation.navigate('Notifications') },
    { title: 'Voice Settings', icon: 'mic-outline', action: () => navigation.navigate('VoiceAssistant') },
    { title: 'Privacy & Security', icon: 'lock-closed-outline', action: () => navigation.navigate('PrivacySecurity') },
    { title: 'Help & Support', icon: 'help-circle-outline', action: () => navigation.navigate('HelpSupport') },
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Profile Section */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: theme.surface }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={[styles.avatar, { backgroundColor: '#FFFFFF' }]}>
            <Ionicons name="person" size={32} color="white" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.name || 'John Doe'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              {user?.email || 'john.doe@example.com'}
            </Text>
            <Text style={[styles.profileAction, { color: '#FFFFFF' }]}>
              Edit Profile
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* AI Assistant Section */}
        <TouchableOpacity
          style={[styles.aiAssistantCard, { backgroundColor: theme.surface }]}
          onPress={() => navigation.navigate('AIAssistant')}
        >
          <View style={[styles.aiAvatar, { backgroundColor: '#FFFFFF' }]}>
            <Ionicons name="sparkles" size={32} color="white" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.assistantName || 'Yo!'} Assistant
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              AI Personal Assistant
            </Text>
            <Text style={[styles.profileAction, { color: '#FFFFFF' }]}>
              Configure Assistant
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* Theme Toggle Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APPEARANCE</Text>
          <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#FFFFFF' : 'rgba(21, 183, 232, 0.1)' }]}>
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={20}
                  color={isDark ? 'white' : '#FFFFFF'}
                />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: '#3396D3' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="rgba(255, 255, 255, 0.3)"
            />
          </View>
        </View>

        {/* General Settings */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>GENERAL</Text>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === settingsItems.length - 1 && styles.lastItem
              ]}
              onPress={item.action}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(21, 183, 232, 0.1)' }]}>
                  <Ionicons name={item.icon as any} size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  {item.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { backgroundColor: theme.surface, marginBottom: 20 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ACCOUNT</Text>
          <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Ionicons name="log-out-outline" size={20} color={theme.error || '#ef4444'} />
              </View>
              <Text style={[styles.settingTitle, { color: theme.error || '#ef4444' }]}>
                Sign Out
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.error || '#ef4444'} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: '#FFFFFF' }]}>
            Yo! Assistant
          </Text>
          <Text style={[styles.appVersion, { color: theme.textSecondary }]}>
            Version 1.0.0 • Build 100
          </Text>
          <Text style={[styles.copyright, { color: theme.textTertiary }]}>
            © 2025 Yo! Technologies
          </Text>
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
    marginRight: 48, // Offset for the back button width
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 16,
  },
  aiAssistantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 5,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(21, 183, 232, 0.2)',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  aiAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 6,
  },
  profileAction: {
    fontSize: 14,
    fontWeight: '500',
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
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 13,
    marginBottom: 2,
  },
  copyright: {
    fontSize: 12,
  },
});

export default ProfileScreen;
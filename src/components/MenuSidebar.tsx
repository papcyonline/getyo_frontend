import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  Dimensions,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState } from '../store';
import { RootStackParamList } from '../types';
import { toggleTheme } from '../store/slices/themeSlice';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface MenuSidebarProps {
  visible: boolean;
  onClose: () => void;
}

const MenuSidebar: React.FC<MenuSidebarProps> = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const isDark = useSelector((state: RootState) => state.theme.isDark);
  const user = useSelector((state: RootState) => state.user.user);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => {
          onClose();
          // Add sign out logic here
          console.log('Sign out');
        }}
      ]
    );
  };

  const menuSections = [
    {
      title: 'PROFILE',
      items: [
        {
          title: 'My Profile',
          subtitle: 'Edit personal information',
          icon: 'person-outline',
          action: () => navigation.navigate('EditProfile')
        },
        {
          title: `${user?.assistantName || 'Yo!'} Assistant`,
          subtitle: 'Configure AI capabilities',
          icon: 'sparkles',
          action: () => navigation.navigate('AIAssistant'),
          special: true
        }
      ]
    },
    {
      title: 'QUICK ACTIONS',
      items: [
        {
          title: 'New Conversation',
          subtitle: 'Start chatting with AI',
          icon: 'chatbubble-outline',
          action: () => navigation.navigate('Conversation', {})
        },
        {
          title: 'Email Management',
          subtitle: 'Smart inbox & AI assistance',
          icon: 'mail-outline',
          action: () => navigation.navigate('EmailManagement')
        },
        {
          title: 'Daily Briefing',
          subtitle: 'Morning & evening summaries',
          icon: 'sunny-outline',
          action: () => navigation.navigate('DailyBriefing')
        },
        {
          title: 'Meeting Prep',
          subtitle: 'AI-powered meeting briefs',
          icon: 'people-outline',
          action: () => navigation.navigate('MeetingPrep')
        },
        {
          title: 'Quick Capture',
          subtitle: 'Voice notes & ideas',
          icon: 'mic-outline',
          action: () => navigation.navigate('QuickCapture')
        },
        {
          title: 'Smart Search',
          subtitle: 'Find anything instantly',
          icon: 'search-outline',
          action: () => navigation.navigate('SmartSearch')
        },
        {
          title: 'Document Intelligence',
          subtitle: 'AI document analysis',
          icon: 'document-text-outline',
          action: () => navigation.navigate('DocumentIntelligence')
        },
        {
          title: 'Financial Dashboard',
          subtitle: 'Portfolio & expense tracking',
          icon: 'stats-chart-outline',
          action: () => navigation.navigate('FinancialDashboard')
        },
        {
          title: 'Team Management',
          subtitle: 'Team insights & 1-on-1s',
          icon: 'people-circle-outline',
          action: () => navigation.navigate('TeamManagement')
        }
      ]
    },
    {
      title: 'SUBSCRIPTION',
      items: [
        {
          title: 'Manage Subscription',
          subtitle: 'View plans and billing',
          icon: 'card-outline',
          action: () => navigation.navigate('Subscription'),
          special: true
        }
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        {
          title: 'Voice Assistant',
          subtitle: 'Voice commands and speech',
          icon: 'mic-outline',
          action: () => navigation.navigate('VoiceAssistant')
        },
        {
          title: 'Notifications',
          subtitle: 'Alerts and reminders',
          icon: 'notifications-outline',
          action: () => navigation.navigate('Notifications')
        },
        {
          title: 'Privacy & Security',
          subtitle: 'Data protection settings',
          icon: 'shield-checkmark-outline',
          action: () => navigation.navigate('PrivacySecurity')
        },
        {
          title: 'Support & Help',
          subtitle: 'Get assistance',
          icon: 'help-circle-outline',
          action: () => navigation.navigate('HelpSupport')
        }
      ]
    }
  ];

  const handleItemPress = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.sidebar, { backgroundColor: '#1a1a1a' }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <View style={styles.headerLeft}>
                {user?.assistantProfileImage ? (
                  <Image
                    source={{ uri: user.assistantProfileImage }}
                    style={styles.userAvatar}
                  />
                ) : (
                  <View style={[styles.userAvatar, { backgroundColor: '#3396D3', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="person" size={24} color="white" />
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: '#FFFFFF' }]}>
                    {user?.preferredName || user?.name || 'Executive'}
                  </Text>
                  <Text style={[styles.assistantName, { color: '#3396D3' }]}>
                    {user?.assistantName || 'Yo!'} Assistant
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Menu Content */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {menuSections.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                    {section.title}
                  </Text>

                  {section.items.map((item, itemIndex) => (
                    <TouchableOpacity
                      key={itemIndex}
                      style={[
                        styles.menuItem,
                        { borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
                        itemIndex === section.items.length - 1 && styles.lastItem,
                        (item as any).special && { backgroundColor: 'rgba(51, 150, 211, 0.1)' }
                      ]}
                      onPress={() => handleItemPress(item.action)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.itemLeft}>
                        <View style={[
                          styles.iconContainer,
                          { backgroundColor: (item as any).special ? '#3396D3' : 'rgba(51, 150, 211, 0.1)' }
                        ]}>
                          <Ionicons
                            name={item.icon as any}
                            size={20}
                            color={(item as any).special ? 'white' : '#3396D3'}
                          />
                        </View>
                        <View style={styles.itemText}>
                          <Text style={[styles.itemTitle, { color: '#FFFFFF' }]}>
                            {item.title}
                          </Text>
                          <Text style={[styles.itemSubtitle, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                            {item.subtitle}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.4)" />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}

              {/* Theme Toggle Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                  PREFERENCES
                </Text>
                <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? '#3396D3' : 'rgba(51, 150, 211, 0.1)' }]}>
                      <Ionicons
                        name={isDark ? "moon" : "sunny"}
                        size={20}
                        color={isDark ? 'white' : '#3396D3'}
                      />
                    </View>
                    <View style={styles.itemText}>
                      <Text style={[styles.itemTitle, { color: '#FFFFFF' }]}>
                        Dark Mode
                      </Text>
                      <Text style={[styles.itemSubtitle, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                        {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={handleThemeToggle}
                    trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#3396D3' }}
                    thumbColor="white"
                    ios_backgroundColor="rgba(255, 255, 255, 0.2)"
                  />
                </View>
              </View>

              {/* Sign Out Section */}
              <View style={styles.section}>
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomWidth: 0 }]}
                  onPress={handleSignOut}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                      <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                    </View>
                    <View style={styles.itemText}>
                      <Text style={[styles.itemTitle, { color: '#ef4444' }]}>
                        Sign Out
                      </Text>
                      <Text style={[styles.itemSubtitle, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                        Sign out of your account
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <LinearGradient
                  colors={['transparent', '#1a1a1a']}
                  style={styles.footerGradient}
                />
                <View style={styles.footerContent}>
                  <Text style={[styles.appVersion, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                    Yo! Assistant v1.0.0
                  </Text>
                  <Text style={[styles.copyright, { color: 'rgba(255, 255, 255, 0.4)' }]}>
                    © 2025 Yo! Technologies
                  </Text>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sidebar: {
    width: width,
    height: height,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderBottomWidth: 0.5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  assistantName: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemLeft: {
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
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    lineHeight: 16,
  },
  footer: {
    position: 'relative',
    paddingTop: 20,
  },
  footerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  footerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  appVersion: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
  },
});

export default MenuSidebar;
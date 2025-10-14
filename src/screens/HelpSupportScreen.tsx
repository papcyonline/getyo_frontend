import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';

const HelpSupportScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@yoassistant.com');
  };

  const handleWebsite = () => {
    Linking.openURL('https://yoassistant.com/help');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+1-800-YO-ASSIST');
  };

  const supportOptions = [
    {
      title: 'Contact Support',
      subtitle: 'Get help from our support team',
      icon: 'headset-outline',
      action: handleEmail
    },
    {
      title: 'Help Center',
      subtitle: 'Browse frequently asked questions',
      icon: 'help-circle-outline',
      action: handleWebsite
    },
    {
      title: 'Phone Support',
      subtitle: '+1-800-YO-ASSIST',
      icon: 'call-outline',
      action: handlePhone
    },
    {
      title: 'Feature Request',
      subtitle: 'Suggest new features or improvements',
      icon: 'bulb-outline',
      action: () => Linking.openURL('mailto:features@yoassistant.com')
    },
  ];

  const resourceOptions = [
    {
      title: 'User Guide',
      subtitle: 'Learn how to use Yo! Assistant',
      icon: 'book-outline',
      action: handleWebsite
    },
    {
      title: 'Video Tutorials',
      subtitle: 'Watch step-by-step tutorials',
      icon: 'play-circle-outline',
      action: () => Linking.openURL('https://youtube.com/@yoassistant')
    },
    {
      title: 'Community Forum',
      subtitle: 'Connect with other users',
      icon: 'people-outline',
      action: () => Linking.openURL('https://community.yoassistant.com')
    },
    {
      title: 'System Status',
      subtitle: 'Check service availability',
      icon: 'speedometer-outline',
      action: () => Linking.openURL('https://status.yoassistant.com')
    },
  ];

  const appInfo = [
    {
      title: 'Terms of Service',
      icon: 'document-text-outline',
      action: () => Linking.openURL('https://yoassistant.com/terms')
    },
    {
      title: 'Privacy Policy',
      icon: 'shield-outline',
      action: () => Linking.openURL('https://yoassistant.com/privacy')
    },
    {
      title: 'App Version',
      subtitle: '1.0.0 (Build 100)',
      icon: 'information-circle-outline',
      action: () => {}
    },
  ];

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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Help & Support</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Get Help Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>GET HELP</Text>
          {supportOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === supportOptions.length - 1 && styles.lastItem
              ]}
              onPress={option.action}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                  <Ionicons name={option.icon as any} size={20} color="#C9A96E" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    {option.subtitle}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Resources Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>RESOURCES</Text>
          {resourceOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === resourceOptions.length - 1 && styles.lastItem
              ]}
              onPress={option.action}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                  <Ionicons name={option.icon as any} size={20} color="#C9A96E" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    {option.subtitle}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Information */}
        <View style={[styles.section, { backgroundColor: theme.surface, marginBottom: 20 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APP INFORMATION</Text>
          {appInfo.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === appInfo.length - 1 && styles.lastItem
              ]}
              onPress={option.action}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                  <Ionicons name={option.icon as any} size={20} color="#C9A96E" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {option.title}
                  </Text>
                  {option.subtitle && (
                    <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                      {option.subtitle}
                    </Text>
                  )}
                </View>
              </View>
              {option.action.toString().includes('{}') ? null : (
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <Text style={[styles.contactTitle, { color: '#C9A96E' }]}>
            Need immediate help?
          </Text>
          <Text style={[styles.contactSubtitle, { color: theme.textSecondary }]}>
            Email us at support@yoassistant.com
          </Text>
          <Text style={[styles.contactSubtitle, { color: theme.textSecondary }]}>
            We typically respond within 24 hours
          </Text>
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
  contactInfo: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default HelpSupportScreen;
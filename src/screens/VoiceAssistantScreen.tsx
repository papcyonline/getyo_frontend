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

const VoiceAssistantScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [autoListen, setAutoListen] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState(true);

  const [selectedVoice, setSelectedVoice] = useState('Alloy');
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
  const [selectedWakeWord, setSelectedWakeWord] = useState('Hey Yo');

  const handleBackPress = () => {
    navigation.goBack();
  };

  const voiceSettings = [
    {
      title: 'Voice Assistant',
      subtitle: 'Enable voice interaction with your assistant',
      value: voiceEnabled,
      onValueChange: setVoiceEnabled,
      icon: 'mic-outline'
    },
    {
      title: 'Wake Word Detection',
      subtitle: 'Activate assistant with wake word',
      value: wakeWordEnabled,
      onValueChange: setWakeWordEnabled,
      icon: 'ear-outline'
    },
    {
      title: 'Auto Listen Mode',
      subtitle: 'Automatically start listening after response',
      value: autoListen,
      onValueChange: setAutoListen,
      icon: 'refresh-outline'
    },
    {
      title: 'Continuous Conversation',
      subtitle: 'Keep conversation active until dismissed',
      value: continuousMode,
      onValueChange: setContinuousMode,
      icon: 'chatbubbles-outline'
    },
    {
      title: 'Voice Feedback',
      subtitle: 'Get spoken responses from assistant',
      value: voiceFeedback,
      onValueChange: setVoiceFeedback,
      icon: 'volume-high-outline'
    },
  ];

  const configOptions = [
    {
      title: 'Assistant Voice',
      subtitle: selectedVoice,
      icon: 'person-circle-outline',
      action: () => {}
    },
    {
      title: 'Language',
      subtitle: selectedLanguage,
      icon: 'language-outline',
      action: () => {}
    },
    {
      title: 'Wake Word',
      subtitle: `"${selectedWakeWord}"`,
      icon: 'radio-outline',
      action: () => {}
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Voice Assistant</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Voice Settings */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>VOICE SETTINGS</Text>
          {voiceSettings.map((setting, index) => (
            <View
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === voiceSettings.length - 1 && styles.lastItem
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

        {/* Configuration */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CONFIGURATION</Text>
          {configOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingItem,
                { borderBottomColor: theme.border },
                index === configOptions.length - 1 && styles.lastItem
              ]}
              onPress={option.action}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(21, 183, 232, 0.1)' }]}>
                  <Ionicons name={option.icon as any} size={20} color="#FFFFFF" />
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

        {/* Test Voice */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TEST & TRAINING</Text>
          <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(21, 183, 232, 0.1)' }]}>
                <Ionicons name="play-circle-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Test Voice Assistant
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  Try out voice commands and responses
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(21, 183, 232, 0.1)' }]}>
                <Ionicons name="school-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Voice Training
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  Improve voice recognition accuracy
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

export default VoiceAssistantScreen;
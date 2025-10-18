import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { RootState } from '../store';
import { addReminder } from '../store/slices/reminderSlice';
import apiService from '../services/api';

const THEME_GOLD = '#C9A96E';

const AddReminderScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeatType, setRepeatType] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [isUrgent, setIsUrgent] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<{ name: string; latitude: number; longitude: number } | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingPulse = useRef(new Animated.Value(1)).current;

  const handleBack = () => {
    navigation.goBack();
  };

  // Initialize audio permissions
  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();

    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  // Recording animation
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingPulse, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(recordingPulse, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      recordingPulse.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsProcessing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      console.log('🎤 Recording stopped, starting transcription...');

      // Transcribe audio
      const transcriptionResult = await apiService.transcribeAudio(uri);

      if (transcriptionResult && transcriptionResult.text) {
        console.log('✅ Transcription successful:', transcriptionResult.text);

        const transcript = transcriptionResult.text;

        // Extract reminder data using AI
        console.log('🤖 Extracting reminder data with AI...');
        const extractedData = await apiService.extractReminderFromVoice(transcript, new Date());

        console.log('✅ AI extraction successful:', extractedData);

        // Auto-fill form fields
        if (extractedData.title) {
          setTitle(extractedData.title);
        }
        if (extractedData.notes) {
          setNotes(extractedData.notes);
        }
        if (extractedData.reminderTime) {
          setReminderTime(new Date(extractedData.reminderTime));
        }
        if (extractedData.isUrgent !== undefined) {
          setIsUrgent(extractedData.isUrgent);
        }
        if (extractedData.repeatType) {
          setRepeatType(extractedData.repeatType);
        }
        if (extractedData.location) {
          setLocation({
            name: extractedData.location,
            latitude: 0,
            longitude: 0,
          });
        }

        Alert.alert('Success', 'Reminder details extracted from your voice!');
      } else {
        console.warn('⚠️ Transcription returned no text');
        Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Failed to process recording:', error);
      Alert.alert(
        'Processing Error',
        error.message || 'Failed to process recording. Please try again.'
      );
    } finally {
      setIsProcessing(false);
      setRecordingDuration(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    setSaving(true);

    try {
      const reminderData = {
        title: title.trim(),
        notes: notes.trim(),
        reminderTime: reminderTime.toISOString(),
        repeatType,
        isUrgent,
        images: images,
        location: location ? {
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
        } : undefined,
        status: 'active' as const,
      };

      console.log('📤 Creating reminder:', reminderData);
      const createdReminder = await apiService.createReminder(reminderData);
      console.log('✅ Reminder created:', createdReminder);

      // Add to Redux store
      dispatch(addReminder(createdReminder));

      Alert.alert('Success', 'Reminder set successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('❌ Failed to create reminder:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create reminder. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to attach images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages([...images, ...newImages]);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handlePickLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant location permissions to add location.');
      return;
    }

    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const locationName = address.name || address.street || address.city || 'Current Location';

      setLocation({
        name: locationName,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const removeLocation = () => {
    setLocation(null);
  };

  const getRepeatConfig = (type: string) => {
    const configs = {
      none: { icon: 'refresh-outline', label: 'Once' },
      daily: { icon: 'today-outline', label: 'Daily' },
      weekly: { icon: 'calendar-outline', label: 'Weekly' },
      monthly: { icon: 'calendar', label: 'Monthly' },
    };
    return configs[type as keyof typeof configs] || configs.none;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Minimal Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Set Reminder</Text>
        <TouchableOpacity
          onPress={handleSave}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={THEME_GOLD} />
          ) : (
            <Text style={[styles.doneButton, { color: THEME_GOLD }]}>Done</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Actions Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.iconButton, images.length > 0 && { backgroundColor: `${THEME_GOLD}20` }]}
          onPress={handlePickImage}
          activeOpacity={0.7}
        >
          <Ionicons name="image" size={22} color={images.length > 0 ? THEME_GOLD : theme.textSecondary} />
          {images.length > 0 && <View style={styles.iconBadge}><Text style={styles.iconBadgeText}>{images.length}</Text></View>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, location && { backgroundColor: `${THEME_GOLD}20` }]}
          onPress={() => setShowLocationModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="location" size={22} color={location ? THEME_GOLD : theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: `${THEME_GOLD}20` }]}
          onPress={() => setShowTimePicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="time" size={22} color={THEME_GOLD} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, repeatType !== 'none' && { backgroundColor: `${THEME_GOLD}20` }]}
          onPress={() => setShowRepeatModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={repeatType === 'none' ? 'refresh-outline' : repeatType === 'daily' ? 'today-outline' : repeatType === 'weekly' ? 'calendar-outline' : 'calendar'}
            size={22}
            color={repeatType !== 'none' ? THEME_GOLD : theme.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, isUrgent && { backgroundColor: '#EF444420' }]}
          onPress={() => setIsUrgent(!isUrgent)}
          activeOpacity={0.7}
        >
          <Ionicons name={isUrgent ? "warning" : "warning-outline"} size={22} color={isUrgent ? '#EF4444' : theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Container */}
      <View style={styles.bottomSheet}>
        {/* Voice Recording Section */}
        <View style={styles.voiceSection}>
          {isRecording || isProcessing ? (
            <View style={styles.recordingActiveContainer}>
              <Animated.View style={[styles.recordingIndicator, { transform: [{ scale: recordingPulse }] }]}>
                <View style={styles.recordingDot} />
              </Animated.View>
              {isRecording ? (
                <>
                  <Text style={[styles.recordingText, { color: theme.text }]}>
                    Recording: {formatDuration(recordingDuration)}
                  </Text>
                  <TouchableOpacity
                    style={styles.stopRecordingButton}
                    onPress={stopRecording}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="stop" size={20} color="#FFFFFF" />
                    <Text style={styles.stopRecordingText}>Stop</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="small" color={THEME_GOLD} />
                  <Text style={[styles.processingText, { color: theme.text }]}>
                    Processing voice...
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.voiceButtonContainer}
              onPress={startRecording}
              activeOpacity={0.8}
            >
              <View style={styles.voiceButton}>
                <Ionicons name="mic" size={28} color="#FFFFFF" />
              </View>
              <Text style={[styles.voiceButtonText, { color: theme.text }]}>
                Tap to dictate reminder
              </Text>
              <Text style={[styles.voiceButtonSubtext, { color: theme.textSecondary }]}>
                Describe what you need to remember
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Title Input */}
          <TextInput
            style={[styles.titleInput, { color: theme.text }]}
            placeholder="Reminder title"
            placeholderTextColor={`${theme.textSecondary}60`}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            autoFocus
            multiline
          />

          {/* Notes Input */}
          <TextInput
            style={[styles.notesInput, { color: theme.text }]}
            placeholder="Add notes..."
            placeholderTextColor={`${theme.textSecondary}60`}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />

          {/* Images Display */}
          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.attachedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={22} color={THEME_GOLD} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Location Display */}
          {location && (
            <View style={styles.locationDisplay}>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={18} color={THEME_GOLD} />
                <Text style={[styles.locationText, { color: theme.text }]}>
                  {location.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={removeLocation}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Reminder Time Display */}
          <View style={styles.metaInfo}>
            <Ionicons name="time" size={16} color={THEME_GOLD} />
            <Text style={[styles.metaText, { color: theme.text }]}>
              {reminderTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </Text>
          </View>

          {/* Repeat Display */}
          {repeatType !== 'none' && (
            <View style={styles.metaInfo}>
              <Ionicons name="repeat" size={16} color={THEME_GOLD} />
              <Text style={[styles.metaText, { color: theme.text }]}>
                Repeats: {repeatType === 'daily' ? 'Daily' : repeatType === 'weekly' ? 'Weekly' : 'Monthly'}
              </Text>
            </View>
          )}

          {/* Urgent Display */}
          {isUrgent && (
            <View style={[styles.metaInfo, { backgroundColor: '#EF444415' }]}>
              <Ionicons name="warning" size={16} color="#EF4444" />
              <Text style={[styles.metaText, { color: '#EF4444' }]}>
                Urgent reminder
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowLocationModal(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.slideUpModal, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.slideUpHeader}>
              <View style={styles.slideUpHandle} />
              <Text style={[styles.slideUpTitle, { color: theme.text }]}>Add Location</Text>
            </View>
            <View style={styles.slideUpContent}>
              <View style={styles.locationInputContainer}>
                <Ionicons name="location-outline" size={20} color={theme.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.locationTextInput, {
                    color: theme.text,
                    backgroundColor: '#1A1A1A',
                    borderColor: '#3A3A3A'
                  }]}
                  placeholder="Type location name..."
                  placeholderTextColor={theme.textTertiary}
                  value={locationInput}
                  onChangeText={setLocationInput}
                  returnKeyType="done"
                  autoFocus
                />
              </View>
              {locationInput.trim().length > 0 && (
                <TouchableOpacity
                  style={[styles.doneModalButton, { backgroundColor: THEME_GOLD }]}
                  onPress={() => {
                    setLocation({
                      name: locationInput.trim(),
                      latitude: 0,
                      longitude: 0,
                    });
                    setLocationInput('');
                    setShowLocationModal(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneModalButtonText}>Add Location</Text>
                </TouchableOpacity>
              )}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={[styles.dividerText, { color: theme.textTertiary }]}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
              <TouchableOpacity
                style={styles.locationOption}
                onPress={async () => {
                  await handlePickLocation();
                  setShowLocationModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.locationOptionIcon}>
                  <Ionicons name="navigate" size={24} color={THEME_GOLD} />
                </View>
                <View style={styles.locationOptionText}>
                  <Text style={[styles.locationOptionTitle, { color: theme.text }]}>Current Location</Text>
                  <Text style={[styles.locationOptionDesc, { color: theme.textSecondary }]}>Use your current location</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
              {location && (
                <View style={styles.selectedLocation}>
                  <Ionicons name="location" size={20} color={THEME_GOLD} />
                  <Text style={[styles.selectedLocationText, { color: theme.text }]}>{location.name}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      removeLocation();
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Repeat Modal */}
      <Modal
        visible={showRepeatModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRepeatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowRepeatModal(false)}
          />
          <View style={[styles.slideUpModal, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.slideUpHeader}>
              <View style={styles.slideUpHandle} />
              <Text style={[styles.slideUpTitle, { color: theme.text }]}>Repeat</Text>
            </View>
            <View style={styles.slideUpContent}>
              {['none', 'daily', 'weekly', 'monthly'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.repeatOption,
                    repeatType === type && { backgroundColor: `${THEME_GOLD}20`, borderColor: THEME_GOLD }
                  ]}
                  onPress={() => {
                    setRepeatType(type as 'none' | 'daily' | 'weekly' | 'monthly');
                    setShowRepeatModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      type === 'none' ? 'refresh-outline' :
                      type === 'daily' ? 'today-outline' :
                      type === 'weekly' ? 'calendar-outline' : 'calendar'
                    }
                    size={24}
                    color={repeatType === type ? THEME_GOLD : theme.textSecondary}
                  />
                  <Text style={[
                    styles.repeatOptionText,
                    { color: repeatType === type ? THEME_GOLD : theme.text }
                  ]}>
                    {type === 'none' ? 'Once' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                  {repeatType === type && <Ionicons name="checkmark-circle" size={24} color={THEME_GOLD} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackground}
              activeOpacity={1}
              onPress={() => setShowTimePicker(false)}
            />
            <View style={[styles.slideUpModal, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.slideUpHeader}>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ position: 'absolute', left: 20, zIndex: 10 }}
                >
                  <Text style={[styles.modalButton, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.slideUpHandle} />
                <Text style={[styles.slideUpTitle, { color: theme.text }]}>Reminder Time</Text>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ position: 'absolute', right: 20, zIndex: 10 }}
                >
                  <Text style={[styles.modalButton, { color: THEME_GOLD, fontWeight: '600' }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.slideUpContent}>
                <DateTimePicker
                  value={reminderTime}
                  mode="datetime"
                  display="spinner"
                  onChange={(event, selectedTime) => {
                    if (Platform.OS === 'android') {
                      if (event.type === 'set' && selectedTime) {
                        setReminderTime(selectedTime);
                      }
                    } else {
                      if (selectedTime) {
                        setReminderTime(selectedTime);
                      }
                    }
                  }}
                  textColor={theme.text}
                  style={styles.datePicker}
                  minimumDate={new Date()}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: THEME_GOLD,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  iconBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  scrollContent: {
    flex: 1,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
    minHeight: 44,
    paddingVertical: 0,
    marginBottom: 16,
  },
  notesInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    paddingVertical: 0,
    opacity: 0.8,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  attachedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#000',
    borderRadius: 12,
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginTop: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    marginTop: 12,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalBackground: {
    flex: 1,
  },
  slideUpModal: {
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  slideUpHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  slideUpHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 12,
  },
  slideUpTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalButton: {
    fontSize: 17,
  },
  slideUpContent: {
    padding: 20,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 12,
  },
  locationOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${THEME_GOLD}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationOptionText: {
    flex: 1,
  },
  locationOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationOptionDesc: {
    fontSize: 13,
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: `${THEME_GOLD}15`,
    borderRadius: 12,
    gap: 12,
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  repeatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  repeatOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  doneModalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  doneModalButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  datePicker: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  voiceSection: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  voiceButtonContainer: {
    alignItems: 'center',
    gap: 12,
  },
  voiceButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: THEME_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  voiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  voiceButtonSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  recordingActiveContainer: {
    alignItems: 'center',
    gap: 16,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4757',
  },
  recordingText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  stopRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: '#FF4757',
  },
  stopRecordingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AddReminderScreen;
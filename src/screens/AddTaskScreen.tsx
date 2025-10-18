import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Image,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { RootState } from '../store';
import { addTask } from '../store/slices/taskSlice';
import { notificationService } from '../services/notificationService';
import { voiceRecordingService } from '../services/voiceRecording';
import apiService from '../services/api';

const THEME_GOLD = '#C9A96E';

const AddTaskScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueTime, setDueTime] = useState<Date | undefined>(undefined);

  // Inline expandable sections (no nested modals)
  const [dateExpanded, setDateExpanded] = useState(false);
  const [timeExpanded, setTimeExpanded] = useState(false);

  // Only for custom picker modal (single modal, not chained)
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);

  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<{ name: string; latitude: number; longitude: number } | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'title' | 'description' | null>(null);

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [showSubtasksModal, setShowSubtasksModal] = useState(false);

  // Recurrence state
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);

  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  // Transcription loading state
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Recording history removed - using big mic button instead

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;

  // Predefined categories
  const categories = [
    { id: 'work', name: 'Work', icon: 'briefcase-outline', color: '#3B82F6' },
    { id: 'personal', name: 'Personal', icon: 'person-outline', color: '#8B5CF6' },
    { id: 'shopping', name: 'Shopping', icon: 'cart-outline', color: '#10B981' },
    { id: 'health', name: 'Health', icon: 'fitness-outline', color: '#EF4444' },
    { id: 'finance', name: 'Finance', icon: 'cash-outline', color: '#F59E0B' },
    { id: 'home', name: 'Home', icon: 'home-outline', color: '#06B6D4' },
    { id: 'learning', name: 'Learning', icon: 'book-outline', color: '#EC4899' },
    { id: 'social', name: 'Social', icon: 'people-outline', color: '#14B8A6' },
  ];

  // Recording animation effect
  useEffect(() => {
    if (isRecording) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Rotate icon (mic to stop transition)
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Stop animations
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();

      // Reset values
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotateAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isRecording]);

  const handleBack = () => {
    navigation.goBack();
  };

  // Quick date selection helpers
  const setQuickDate = (type: 'today' | 'tomorrow' | 'next_week' | 'next_month') => {
    const date = new Date();
    date.setHours(9, 0, 0, 0); // Default to 9 AM

    switch (type) {
      case 'today':
        break;
      case 'tomorrow':
        date.setDate(date.getDate() + 1);
        break;
      case 'next_week':
        date.setDate(date.getDate() + 7);
        break;
      case 'next_month':
        date.setMonth(date.getMonth() + 1);
        break;
    }

    setDueDate(date);
    setDueTime(date);
    setDateExpanded(false);
    setTimeExpanded(true); // Auto-expand time selection
  };

  const setQuickTime = (hours: number, minutes: number = 0) => {
    const time = new Date(dueDate || new Date());
    time.setHours(hours, minutes, 0, 0);
    setDueTime(time);
    setTimeExpanded(false); // Collapse time section after selection
  };

  const combineDateAndTime = (date: Date | undefined, time: Date | undefined): Date | undefined => {
    if (!date) return undefined;

    const combined = new Date(date);
    if (time) {
      combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    }
    return combined;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const finalDueDate = combineDateAndTime(dueDate, dueTime);

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'pending' as const,
      dueDate: finalDueDate,
      reminders: hasReminder ? [{
        id: Date.now().toString(),
        dateTime: reminderTime,
        type: 'once' as const,
        enabled: true
      }] : [],
      tags,
      images,
      location,
      category,
      subtasks,
      recurrence: recurrence !== 'none' ? {
        enabled: true,
        frequency: recurrence as 'daily' | 'weekly' | 'monthly' | 'yearly',
        interval: 1
      } : undefined,
      createdBy: 'user' as const,
    };

    try {
      // Save to backend
      const savedTask = await apiService.createTask(taskData);

      // Update Redux store with the saved task
      dispatch(addTask(savedTask));

      // Schedule notification if reminder is enabled and service is available
      if (hasReminder && finalDueDate) {
        try {
          if (notificationService && notificationService.scheduleTaskDeadlineReminder) {
            await notificationService.scheduleTaskDeadlineReminder({
              taskTitle: title.trim(),
              deadline: finalDueDate,
              priority: priority,
            });
          }
        } catch (error) {
          console.error('Failed to schedule notification:', error);
          // Don't block task creation if notification fails
        }
      }

      Alert.alert('Success', 'Task created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    }
  };

  const getPriorityConfig = (p: string) => {
    switch (p) {
      case 'high':
        return { color: '#EF4444', icon: 'flame', label: 'High', bg: '#FEE2E2' };
      case 'medium':
        return { color: '#F59E0B', icon: 'star', label: 'Medium', bg: '#FEF3C7' };
      case 'low':
        return { color: '#10B981', icon: 'checkmark-circle', label: 'Low', bg: '#D1FAE5' };
      default:
        return { color: THEME_GOLD, icon: 'star', label: 'Medium', bg: '#FEF3C7' };
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
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

  const addSubtask = () => {
    if (subtaskInput.trim()) {
      const newSubtask = {
        id: Date.now().toString(),
        text: subtaskInput.trim(),
        completed: false,
      };
      setSubtasks([...subtasks, newSubtask]);
      setSubtaskInput('');
    }
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(subtask =>
      subtask.id === id ? { ...subtask, completed: !subtask.completed } : subtask
    ));
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(subtask => subtask.id !== id));
  };

  const handleAIAssistant = async () => {
    if (!title.trim()) {
      Alert.alert('Add a Title', 'Please add a task title first so the AI can analyze it.');
      return;
    }

    // Placeholder for AI Assistant integration
    // In production, this would call your backend AI service
    Alert.alert(
      'AI Assistant',
      'AI-powered suggestions require backend integration. The AI would analyze your task and suggest:\n\n• Priority level\n• Category\n• Subtasks breakdown\n• Optimal timing\n• Smart reminders',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Learn More',
          onPress: () => {
            Alert.alert(
              'Setup Required',
              'To enable AI suggestions, integrate with your backend AI service (OpenAI, Claude, etc.) in the API layer'
            );
          },
        },
      ]
    );

    // Example implementation when AI service is integrated:
    // try {
    //   const response = await apiService.getAISuggestions({
    //     title: title.trim(),
    //     description: description.trim(),
    //   });
    //
    //   setAiSuggestions(response.data);
    //   setShowAIAssistant(true);
    //
    //   // Auto-apply suggestions if user wants
    //   if (response.data.suggestedPriority) {
    //     setPriority(response.data.suggestedPriority);
    //   }
    //   if (response.data.suggestedCategory) {
    //     setCategory(response.data.suggestedCategory);
    //   }
    //   if (response.data.suggestedSubtasks) {
    //     setSubtasks(response.data.suggestedSubtasks);
    //   }
    // } catch (error) {
    //   console.error('AI suggestion error:', error);
    //   Alert.alert('Error', 'Failed to get AI suggestions');
    // }
  };

  const handleVoiceInput = async (type: 'title' | 'description') => {
    try {
      if (isRecording) {
        // Stop recording
        console.log('Stopping recording...');

        const audioUri = await voiceRecordingService.stopRecording();

        // Reset recording state immediately for visual feedback
        setIsRecording(false);
        setRecordingType(null);

        if (!audioUri) {
          Alert.alert('Error', 'Failed to save recording');
          return;
        }

        // Show loading indicator (non-blocking)
        console.log('Transcribing audio...');

        // Transcribe the audio
        const result = await voiceRecordingService.transcribeAudio(audioUri);

        if (result && result.text) {
          console.log('✅ Transcription successful:', result.text);

          // Use AI to extract structured task data from the transcript
          console.log('🤖 Extracting task data using AI...');
          const recordedAt = new Date();

          try {
            const aiExtractedData = await apiService.extractTaskFromVoice(result.text, recordedAt);

            // Apply AI-extracted data to the form
            setTitle(aiExtractedData.title);
            setDescription(aiExtractedData.description || '');

            // Set priority if AI determined one
            if (aiExtractedData.priority) {
              setPriority(aiExtractedData.priority);
            }

            // Set category if AI inferred one
            if (aiExtractedData.category) {
              setCategory(aiExtractedData.category);
            }

            // Set tags if AI extracted any
            if (aiExtractedData.tags && aiExtractedData.tags.length > 0) {
              setTags(aiExtractedData.tags);
            }

            // Set location if AI found one
            if (aiExtractedData.location) {
              setLocation({
                name: aiExtractedData.location,
                latitude: 0,
                longitude: 0
              });
            }

            // Set due date if AI parsed one
            if (aiExtractedData.dueDate) {
              setDueDate(new Date(aiExtractedData.dueDate));
              setDueTime(new Date(aiExtractedData.dueDate));
            }

            console.log('✅ AI extraction successful:', aiExtractedData);

            // Auto-save the task with AI-extracted data
            try {
              const finalDueDate = aiExtractedData.dueDate ? new Date(aiExtractedData.dueDate) : undefined;

              const taskData = {
                title: aiExtractedData.title,
                description: aiExtractedData.description || '',
                priority: aiExtractedData.priority || 'medium',
                status: 'pending' as const,
                dueDate: finalDueDate,
                reminders: hasReminder ? [{
                  id: Date.now().toString(),
                  dateTime: reminderTime,
                  type: 'once' as const,
                  enabled: true
                }] : [],
                tags: aiExtractedData.tags || [],
                images,
                location: aiExtractedData.location ? {
                  name: aiExtractedData.location,
                  latitude: 0,
                  longitude: 0
                } : undefined,
                category: aiExtractedData.category || undefined,
                subtasks,
                recurrence: recurrence !== 'none' ? {
                  enabled: true,
                  frequency: recurrence as 'daily' | 'weekly' | 'monthly' | 'yearly',
                  interval: 1
                } : undefined,
                createdBy: 'voice' as const,
              };

              // Save to backend
              const savedTask = await apiService.createTask(taskData);

              // Update Redux store
              dispatch(addTask(savedTask));

              // Build success message with extracted details
              let successMessage = `Task "${aiExtractedData.title}" created!`;
              if (aiExtractedData.dueDate) {
                successMessage += `\nDue: ${new Date(aiExtractedData.dueDate).toLocaleString()}`;
              }
              if (aiExtractedData.priority && aiExtractedData.priority !== 'medium') {
                successMessage += `\nPriority: ${aiExtractedData.priority}`;
              }

              // Show success message
              Alert.alert('✅ Voice Task Created', successMessage, [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);

              console.log('✅ Task auto-saved successfully');
            } catch (error: any) {
              console.error('Failed to auto-save task:', error);
              Alert.alert('Error', 'AI extracted the data but failed to save. You can save it manually.');
            }

          } catch (aiError: any) {
            console.error('AI extraction failed:', aiError);
            Alert.alert('Error', 'AI extraction failed. Please try dictating again or type manually.');
          }
        } else {
          Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
        }
      } else {
        // Start recording
        console.log('Starting recording...');
        const hasPermission = await voiceRecordingService.requestPermissions();

        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Microphone permission is required for voice input. Please enable it in your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }

        const started = await voiceRecordingService.startRecording();
        if (started) {
          setIsRecording(true);
          setRecordingType(type);
          console.log('🎤 Recording started - tap stop button when done');
          // No alert - just let the animations show the recording state
        } else {
          Alert.alert('Error', 'Failed to start recording. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Voice input error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred. Please try again.');
      setIsRecording(false);
      setRecordingType(null);
    }
  };


  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleBack}
      />

      {/* Header on Black Background with Recording Animation */}
      <Animated.View
        style={{
          paddingTop: insets.top + 8,
          transform: [{ scale: pulseAnim }],
        }}
      >
        {/* Recording Glow Overlay */}
        {isRecording && (
          <Animated.View
            style={[
              styles.recordingGlow,
              {
                opacity: glowAnim,
                backgroundColor: 'rgba(239, 68, 68, 0.15)', // Red glow
              },
            ]}
          />
        )}

        <View style={styles.topHeader}>
          <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Add Task</Text>

          {/* Animated Mic/Stop Button */}
          <Animated.View
            style={{
              transform: [
                {
                  rotate: iconRotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={[
                styles.headerMicButton,
                isRecording && {
                  backgroundColor: '#EF444420',
                  borderWidth: 2,
                  borderColor: '#EF4444',
                }
              ]}
              onPress={() => handleVoiceInput('title')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic-outline'}
                size={22}
                color={isRecording ? '#EF4444' : theme.textSecondary}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
        <Animated.Text
          style={[
            styles.guideText,
            {
              color: isRecording ? '#EF4444' : theme.textTertiary,
              opacity: isRecording ? glowAnim : 0.7,
            }
          ]}
        >
          {isRecording ? '🔴 Recording... Tap stop when done' : 'Tap the mic to dictate or type your task below'}
        </Animated.Text>
      </Animated.View>

      {/* Bottom Sheet Container */}
      <KeyboardAvoidingView
        style={[styles.bottomSheetContainer, { backgroundColor: theme.card || '#1A1A1A' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >

        {/* Content Area */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <TextInput
            style={[styles.titleInput, { color: theme.text }]}
            placeholder="Add note title"
            placeholderTextColor={`${theme.textSecondary}70`}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            autoFocus
          />

          {/* Divider */}
          <View style={[styles.dividerLine, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />

          {/* Description Area */}
          <TextInput
            style={[styles.bigTextArea, { color: theme.text }]}
            placeholder="Start typing..."
            placeholderTextColor={`${theme.textSecondary}60`}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          {/* Tags Display */}
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: `${THEME_GOLD}20`, borderColor: `${THEME_GOLD}50` }]}
                >
                  <Text style={[styles.tagText, { color: THEME_GOLD }]}>#{tag}</Text>
                  <TouchableOpacity
                    onPress={() => removeTag(tag)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={14} color={THEME_GOLD} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

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
            <View style={[styles.locationDisplay, { marginTop: 12, marginBottom: 0 }]}>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={18} color={THEME_GOLD} />
                <Text style={[styles.locationText, { color: theme.text }]}>{location.name}</Text>
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

          {/* Due Date Display */}
          {dueDate && (
            <View style={[styles.dueDateBadge, { backgroundColor: `${THEME_GOLD}15`, marginTop: 12 }]}>
              <Ionicons name="calendar" size={16} color={THEME_GOLD} />
              <Text style={[styles.dueDateBadgeText, { color: THEME_GOLD }]}>
                {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {dueTime && ` at ${dueTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setDueDate(undefined);
                  setDueTime(undefined);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={16} color={THEME_GOLD} />
              </TouchableOpacity>
            </View>
          )}

          {/* Priority Badge - Only show if not default medium */}
          {priority && priority !== 'medium' && (
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityConfig(priority).bg, marginTop: 8 }]}>
              <Ionicons name={getPriorityConfig(priority).icon as any} size={14} color={getPriorityConfig(priority).color} />
              <Text style={[styles.priorityBadgeText, { color: getPriorityConfig(priority).color }]}>
                {getPriorityConfig(priority).label} Priority
              </Text>
            </View>
          )}

          {/* Category Badge */}
          {category && (
            <View style={[styles.categoryBadge, {
              backgroundColor: `${categories.find(c => c.id === category)?.color}15`,
              borderColor: `${categories.find(c => c.id === category)?.color}40`,
              marginTop: 8
            }]}>
              <Ionicons
                name={categories.find(c => c.id === category)?.icon as any}
                size={14}
                color={categories.find(c => c.id === category)?.color}
              />
              <Text style={[styles.categoryBadgeText, { color: categories.find(c => c.id === category)?.color }]}>
                {categories.find(c => c.id === category)?.name}
              </Text>
              <TouchableOpacity
                onPress={() => setCategory(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={14} color={categories.find(c => c.id === category)?.color} />
              </TouchableOpacity>
            </View>
          )}

          {/* Recurrence Badge */}
          {recurrence !== 'none' && (
            <View style={[styles.recurrenceBadge, { backgroundColor: `${THEME_GOLD}15`, marginTop: 8 }]}>
              <Ionicons name="repeat" size={14} color={THEME_GOLD} />
              <Text style={[styles.recurrenceBadgeText, { color: THEME_GOLD }]}>
                Repeats {recurrence}
              </Text>
              <TouchableOpacity
                onPress={() => setRecurrence('none')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={14} color={THEME_GOLD} />
              </TouchableOpacity>
            </View>
          )}

          {/* Subtasks Display */}
          {subtasks.length > 0 && (
            <View style={styles.subtasksContainer}>
              <Text style={[styles.subtasksTitle, { color: theme.textSecondary }]}>
                Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})
              </Text>
              {subtasks.map((subtask) => (
                <TouchableOpacity
                  key={subtask.id}
                  style={styles.subtaskItem}
                  onPress={() => toggleSubtask(subtask.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.subtaskCheckbox,
                    subtask.completed && { backgroundColor: THEME_GOLD, borderColor: THEME_GOLD }
                  ]}>
                    {subtask.completed && (
                      <Ionicons name="checkmark" size={14} color="#000" />
                    )}
                  </View>
                  <Text style={[
                    styles.subtaskText,
                    { color: theme.text },
                    subtask.completed && styles.subtaskTextCompleted
                  ]}>
                    {subtask.text}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeSubtask(subtask.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* AI Assistant FAB */}
        {title.trim().length > 0 && (
          <TouchableOpacity
            style={[styles.aiFab, { backgroundColor: THEME_GOLD }]}
            onPress={handleAIAssistant}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={24} color="#000" />
          </TouchableOpacity>
        )}

        {/* Bottom Toolbar */}
        <View style={[styles.bottomToolbar, { paddingBottom: insets.bottom + 10, borderTopColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <TouchableOpacity
            style={[styles.toolbarButton, dueDate && { backgroundColor: `${THEME_GOLD}20` }]}
            onPress={() => setShowCustomDateModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={22} color={dueDate ? THEME_GOLD : theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolbarButton, { backgroundColor: getPriorityConfig(priority).bg }]}
            onPress={() => {
              const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
              const currentIndex = priorities.indexOf(priority);
              const nextIndex = (currentIndex + 1) % 3;
              setPriority(priorities[nextIndex]);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={getPriorityConfig(priority).icon as any}
              size={22}
              color={getPriorityConfig(priority).color}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolbarButton, category && { backgroundColor: `${categories.find(c => c.id === category)?.color}20` }]}
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="folder-outline" size={22} color={category ? categories.find(c => c.id === category)?.color : theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolbarButton, tags.length > 0 && { backgroundColor: `${THEME_GOLD}20` }]}
            onPress={() => setShowTagModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="pricetag-outline" size={22} color={tags.length > 0 ? THEME_GOLD : theme.textSecondary} />
            {tags.length > 0 && (
              <View style={styles.toolbarBadge}>
                <Text style={styles.toolbarBadgeText}>{tags.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolbarButton, images.length > 0 && { backgroundColor: `${THEME_GOLD}20` }]}
            onPress={handlePickImage}
            activeOpacity={0.7}
          >
            <Ionicons name="image-outline" size={22} color={images.length > 0 ? THEME_GOLD : theme.textSecondary} />
            {images.length > 0 && (
              <View style={styles.toolbarBadge}>
                <Text style={styles.toolbarBadgeText}>{images.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolbarButton, location && { backgroundColor: `${THEME_GOLD}20` }]}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={22} color={location ? THEME_GOLD : theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolbarButton, subtasks.length > 0 && { backgroundColor: `${THEME_GOLD}20` }]}
            onPress={() => setShowSubtasksModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="list-outline" size={22} color={subtasks.length > 0 ? THEME_GOLD : theme.textSecondary} />
            {subtasks.length > 0 && (
              <View style={styles.toolbarBadge}>
                <Text style={styles.toolbarBadgeText}>{subtasks.filter(s => s.completed).length}/{subtasks.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolbarButton, hasReminder && { backgroundColor: `${THEME_GOLD}20` }]}
            onPress={() => setHasReminder(!hasReminder)}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={hasReminder ? THEME_GOLD : theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Tag Modal */}
      <Modal
        visible={showTagModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTagModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowTagModal(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.slideUpModal, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.slideUpHeader}>
              <View style={styles.slideUpHandle} />
              <Text style={[styles.slideUpTitle, { color: theme.text }]}>Add Tags</Text>
            </View>
            <View style={styles.slideUpContent}>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[styles.tagInput, {
                    color: theme.text,
                    backgroundColor: '#1A1A1A',
                    borderColor: '#3A3A3A'
                  }]}
                  placeholder="Type tag name..."
                  placeholderTextColor={theme.textTertiary}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.addTagButton, {
                    backgroundColor: tagInput.trim() ? THEME_GOLD : '#3A3A3A',
                    opacity: tagInput.trim() ? 1 : 0.5,
                  }]}
                  onPress={addTag}
                  disabled={!tagInput.trim()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <View key={index} style={[styles.tag, {
                      backgroundColor: `${THEME_GOLD}20`,
                      borderColor: `${THEME_GOLD}50`
                    }]}>
                      <Text style={[styles.tagText, { color: THEME_GOLD }]}>#{tag}</Text>
                      <TouchableOpacity
                        onPress={() => removeTag(tag)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={14} color={THEME_GOLD} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity
                style={[styles.doneModalButton, { backgroundColor: THEME_GOLD }]}
                onPress={() => setShowTagModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.doneModalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

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
                <View style={styles.dividerLineHorizontal} />
                <Text style={[styles.dividerText, { color: theme.textTertiary }]}>OR</Text>
                <View style={styles.dividerLineHorizontal} />
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

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowCategoryModal(false)}
          />
          <View style={[styles.slideUpModal, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.slideUpHeader}>
              <View style={styles.slideUpHandle} />
              <Text style={[styles.slideUpTitle, { color: theme.text }]}>Select Category</Text>
            </View>
            <View style={styles.slideUpContent}>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: category === cat.id ? `${cat.color}20` : '#1A1A1A',
                        borderColor: category === cat.id ? cat.color : '#3A3A3A',
                      }
                    ]}
                    onPress={() => {
                      setCategory(cat.id);
                      setShowCategoryModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.categoryCardIcon, { backgroundColor: `${cat.color}20` }]}>
                      <Ionicons name={cat.icon as any} size={28} color={cat.color} />
                    </View>
                    <Text style={[styles.categoryCardText, { color: theme.text }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {category && (
                <TouchableOpacity
                  style={[styles.clearCategoryButton, { backgroundColor: '#1A1A1A', marginTop: 20 }]}
                  onPress={() => {
                    setCategory(null);
                    setShowCategoryModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle-outline" size={20} color={theme.textSecondary} />
                  <Text style={[styles.clearCategoryText, { color: theme.textSecondary }]}>Clear Category</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Subtasks Modal */}
      <Modal
        visible={showSubtasksModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubtasksModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowSubtasksModal(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.slideUpModal, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.slideUpHeader}>
              <View style={styles.slideUpHandle} />
              <Text style={[styles.slideUpTitle, { color: theme.text }]}>Add Subtasks</Text>
            </View>
            <View style={styles.slideUpContent}>
              <View style={styles.subtaskInputContainer}>
                <TextInput
                  style={[styles.subtaskInput, {
                    color: theme.text,
                    backgroundColor: '#1A1A1A',
                    borderColor: '#3A3A3A'
                  }]}
                  placeholder="Type subtask..."
                  placeholderTextColor={theme.textTertiary}
                  value={subtaskInput}
                  onChangeText={setSubtaskInput}
                  onSubmitEditing={addSubtask}
                  returnKeyType="done"
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.addSubtaskButton, {
                    backgroundColor: subtaskInput.trim() ? THEME_GOLD : '#3A3A3A',
                    opacity: subtaskInput.trim() ? 1 : 0.5,
                  }]}
                  onPress={addSubtask}
                  disabled={!subtaskInput.trim()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {subtasks.length > 0 && (
                <View style={styles.subtasksListContainer}>
                  <Text style={[styles.subtasksCountText, { color: theme.textSecondary }]}>
                    {subtasks.filter(s => s.completed).length} of {subtasks.length} completed
                  </Text>
                  {subtasks.map((subtask) => (
                    <View key={subtask.id} style={[styles.subtaskModalItem, { backgroundColor: '#1A1A1A' }]}>
                      <TouchableOpacity
                        onPress={() => toggleSubtask(subtask.id)}
                        style={styles.subtaskModalCheckbox}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.subtaskCheckbox,
                          subtask.completed && { backgroundColor: THEME_GOLD, borderColor: THEME_GOLD }
                        ]}>
                          {subtask.completed && (
                            <Ionicons name="checkmark" size={14} color="#000" />
                          )}
                        </View>
                        <Text style={[
                          styles.subtaskModalText,
                          { color: theme.text },
                          subtask.completed && styles.subtaskTextCompleted
                        ]}>
                          {subtask.text}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeSubtask(subtask.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity
                style={[styles.doneModalButton, { backgroundColor: THEME_GOLD }]}
                onPress={() => setShowSubtasksModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.doneModalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Combined Date & Time Modal */}
      <Modal
        visible={showCustomDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowCustomDateModal(false)}
          />
          <View style={[styles.slideUpModal, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.slideUpHeader}>
              <TouchableOpacity
                onPress={() => setShowCustomDateModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ position: 'absolute', left: 20, zIndex: 10 }}
              >
                <Text style={[styles.modalButton, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <View style={styles.slideUpHandle} />
              <Text style={[styles.slideUpTitle, { color: theme.text }]}>Set Due Date & Time</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!dueDate) {
                    const defaultDate = new Date();
                    defaultDate.setHours(9, 0, 0, 0);
                    setDueDate(defaultDate);
                    setDueTime(defaultDate);
                  }
                  setShowCustomDateModal(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ position: 'absolute', right: 20, zIndex: 10 }}
              >
                <Text style={[styles.modalButton, { color: THEME_GOLD, fontWeight: '600' }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.slideUpContent}>
              {/* Date Picker */}
              <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>Date</Text>
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setDueDate(selectedDate);
                    if (!dueTime) {
                      const defaultTime = new Date(selectedDate);
                      defaultTime.setHours(9, 0, 0, 0);
                      setDueTime(defaultTime);
                    }
                  }
                }}
                textColor={theme.text}
                style={styles.datePicker}
                minimumDate={new Date()}
              />

              {/* Divider */}
              <View style={[styles.pickerDivider, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />

              {/* Time Picker */}
              <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>Time</Text>
              <DateTimePicker
                value={dueTime || new Date()}
                mode="time"
                display="spinner"
                onChange={(event, selectedTime) => {
                  if (selectedTime) {
                    setDueTime(selectedTime);
                  }
                }}
                textColor={theme.text}
                style={styles.datePicker}
              />

              {/* Divider */}
              <View style={[styles.pickerDivider, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />

              {/* Recurrence Section */}
              <TouchableOpacity
                style={styles.recurrenceToggle}
                onPress={() => setShowRecurrenceOptions(!showRecurrenceOptions)}
                activeOpacity={0.7}
              >
                <View style={styles.recurrenceToggleLeft}>
                  <Ionicons name="repeat" size={20} color={theme.textSecondary} />
                  <Text style={[styles.recurrenceToggleText, { color: theme.text }]}>Repeat</Text>
                </View>
                <View style={styles.recurrenceToggleRight}>
                  <Text style={[styles.recurrenceValue, { color: recurrence !== 'none' ? THEME_GOLD : theme.textSecondary }]}>
                    {recurrence !== 'none' ? recurrence.charAt(0).toUpperCase() + recurrence.slice(1) : 'None'}
                  </Text>
                  <Ionicons
                    name={showRecurrenceOptions ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.textSecondary}
                  />
                </View>
              </TouchableOpacity>

              {/* Recurrence Options */}
              {showRecurrenceOptions && (
                <View style={styles.recurrenceOptions}>
                  {['none', 'daily', 'weekly', 'monthly', 'yearly'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.recurrenceOption,
                        {
                          backgroundColor: recurrence === option ? `${THEME_GOLD}20` : '#1A1A1A',
                          borderColor: recurrence === option ? THEME_GOLD : '#3A3A3A',
                        }
                      ]}
                      onPress={() => setRecurrence(option as any)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.recurrenceOptionText,
                        { color: recurrence === option ? THEME_GOLD : theme.text }
                      ]}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                      {recurrence === option && (
                        <Ionicons name="checkmark-circle" size={20} color={THEME_GOLD} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  headerMicButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  guideText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    opacity: 0.7,
  },
  recordingGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    zIndex: 0,
  },
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    paddingVertical: 12,
    color: '#FFF',
  },
  dividerLine: {
    height: 1,
    marginBottom: 16,
  },
  bigTextArea: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    paddingVertical: 0,
    opacity: 0.9,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  expandedContent: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 12,
  },
  optionalButtonText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 12,
  },
  customButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  // Set Due Date Button
  setDueDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1.5,
  },
  setDueDateText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  // Due Date Display
  dueDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1.5,
  },
  dueDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dueDateLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  dueDateValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Priority Section - Small
  prioritySection: {
    marginTop: 24,
    marginBottom: 8,
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  priorityContainerSmall: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  priorityChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // More Options Button
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // More Options Container
  moreOptionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  moreOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
  },
  moreOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Picker Labels
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
  },
  pickerDivider: {
    height: 1,
    marginVertical: 16,
  },
  // AI Assistant FAB
  aiFab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  // Bottom Toolbar
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  toolbarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
  },
  toolbarBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: THEME_GOLD,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toolbarBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  // Badges for selected items
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dueDateBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
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
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  addTagButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  dividerLineHorizontal: {
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
  // Date & Time Card Styles
  dateTimeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: `${THEME_GOLD}30`,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTimeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${THEME_GOLD}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateTimeDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  // Quick Selection Styles
  quickDateScroll: {
    marginBottom: 16,
  },
  quickDateContainer: {
    paddingRight: 20,
    gap: 10,
  },
  quickDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1.5,
  },
  quickDateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Date Selection Grid
  quickDateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickDateCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickDateCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickDateCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickDateCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Time Selection Grid
  timeSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeButton: {
    width: '31%',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Custom Picker Button
  customDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 16,
  },
  customDateButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  // Category Badge
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Category Modal Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 8,
  },
  categoryCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryCardText: {
    fontSize: 15,
    fontWeight: '600',
  },
  clearCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  clearCategoryText: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Subtasks Display
  subtasksContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  subtasksTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  subtaskTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  // Subtasks Modal
  subtaskInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  subtaskInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  addSubtaskButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtasksListContainer: {
    marginBottom: 20,
  },
  subtasksCountText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  subtaskModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  subtaskModalCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subtaskModalText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  // Recurrence Badge
  recurrenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  recurrenceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Recurrence Options in Modal
  recurrenceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
  },
  recurrenceToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recurrenceToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recurrenceToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  recurrenceValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  recurrenceOptions: {
    marginTop: 12,
    gap: 8,
  },
  recurrenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  recurrenceOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Recording History Styles
  recordingHistoryContainer: {
    marginTop: 20,
    marginBottom: 12,
  },
  recordingHistoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  playButtonContainer: {
    marginRight: 4,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingTextContainer: {
    flex: 1,
    gap: 4,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  recordingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordingMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  useRecordingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDivider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 12,
  },
});

export default AddTaskScreen;

import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RootState } from '../store';
import { addEvent } from '../store/slices/calendarSlice';

const AddEventScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour later
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [hasReminder, setHasReminder] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [attendees, setAttendees] = useState('');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    if (endTime <= startTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    const newEvent = {
      id: Date.now().toString(),
      userId: 'current-user', // TODO: Get from user context/auth
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      attendees: attendees.split(',').map(email => email.trim()).filter(email => email),
      reminders: hasReminder ? [`${new Date(startTime.getTime() - reminderMinutes * 60 * 1000).toISOString()}`] : [],
      source: 'manual' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch(addEvent(newEvent));
    Alert.alert('Success', 'Event created successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const formatDateTime = (date: Date) => {
    if (allDay) {
      return date.toLocaleDateString();
    }
    return date.toLocaleString();
  };

  const getReminderText = () => {
    if (reminderMinutes < 60) {
      return `${reminderMinutes} minutes before`;
    } else if (reminderMinutes < 1440) {
      const hours = Math.floor(reminderMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} before`;
    } else {
      const days = Math.floor(reminderMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} before`;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Event</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Event Title</Text>
          <TextInput
            style={[styles.titleInput, {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Enter event title"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* All Day Toggle */}
        <View style={styles.section}>
          <View style={styles.allDayHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>All Day Event</Text>
            <Switch
              value={allDay}
              onValueChange={setAllDay}
              trackColor={{ false: theme.border, true: '#10B981' }}
              thumbColor={allDay ? '#FFF7F5' : theme.textSecondary}
            />
          </View>
        </View>

        {/* Start Time */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Start Time</Text>
          <TouchableOpacity
            style={[styles.timeButton, {
              backgroundColor: theme.surface,
              borderColor: theme.border
            }]}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#10B981" />
            <Text style={[styles.timeButtonText, { color: theme.text }]}>
              {formatDateTime(startTime)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* End Time */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>End Time</Text>
          <TouchableOpacity
            style={[styles.timeButton, {
              backgroundColor: theme.surface,
              borderColor: theme.border
            }]}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#10B981" />
            <Text style={[styles.timeButtonText, { color: theme.text }]}>
              {formatDateTime(endTime)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Location (Optional)</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Enter location or meeting link"
            placeholderTextColor={theme.textSecondary}
            value={location}
            onChangeText={setLocation}
            maxLength={200}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Description (Optional)</Text>
          <TextInput
            style={[styles.descriptionInput, {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Enter event description"
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

        {/* Attendees */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Attendees (Optional)</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Enter email addresses separated by commas"
            placeholderTextColor={theme.textSecondary}
            value={attendees}
            onChangeText={setAttendees}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Reminder */}
        <View style={styles.section}>
          <View style={styles.reminderHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Reminder</Text>
            <Switch
              value={hasReminder}
              onValueChange={setHasReminder}
              trackColor={{ false: theme.border, true: '#10B981' }}
              thumbColor={hasReminder ? '#FFF7F5' : theme.textSecondary}
            />
          </View>
          {hasReminder && (
            <View style={styles.reminderOptions}>
              {[15, 30, 60, 1440].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.reminderOption,
                    {
                      backgroundColor: reminderMinutes === minutes ? '#10B981' : theme.surface,
                      borderColor: reminderMinutes === minutes ? '#10B981' : theme.border
                    }
                  ]}
                  onPress={() => setReminderMinutes(minutes)}
                >
                  <Text style={[
                    styles.reminderOptionText,
                    {
                      color: reminderMinutes === minutes ? '#FFF7F5' : theme.text
                    }
                  ]}>
                    {minutes < 60 ? `${minutes}m` : minutes < 1440 ? `${minutes/60}h` : `${minutes/1440}d`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Event Preview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Preview</Text>
          <View style={[styles.previewCard, {
            backgroundColor: theme.surface,
            borderColor: theme.border
          }]}>
            <View style={styles.previewHeader}>
              <Ionicons name="calendar" size={20} color="#10B981" />
              <Text style={[styles.previewTitle, { color: theme.text }]}>
                {title || 'Event Title'}
              </Text>
              {allDay && (
                <View style={styles.allDayBadge}>
                  <Text style={styles.allDayBadgeText}>ALL DAY</Text>
                </View>
              )}
            </View>
            <Text style={[styles.previewTime, { color: theme.textSecondary }]}>
              {formatDateTime(startTime)} - {formatDateTime(endTime)}
            </Text>
            {location && (
              <View style={styles.previewLocation}>
                <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.previewLocationText, { color: theme.textSecondary }]}>
                  {location}
                </Text>
              </View>
            )}
            {hasReminder && (
              <View style={styles.previewReminder}>
                <Ionicons name="alarm-outline" size={16} color="#10B981" />
                <Text style={[styles.previewReminderText, { color: theme.textSecondary }]}>
                  Reminder: {getReminderText()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Start Time Picker Modal */}
      <Modal
        visible={showStartPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStartPicker(false)}
      >
        <View style={styles.datePickerModalOverlay}>
          <TouchableOpacity
            style={styles.datePickerModalBackground}
            activeOpacity={1}
            onPress={() => setShowStartPicker(false)}
          />
          <View style={[styles.datePickerContainer, { backgroundColor: theme.surface }]}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                <Text style={[styles.datePickerButton, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.datePickerTitle, { color: theme.text }]}>Select Start Time</Text>
              <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                <Text style={[styles.datePickerButton, { color: '#10B981' }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={startTime}
              mode={allDay ? "date" : "datetime"}
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setStartTime(selectedDate);
                  // Auto-adjust end time to be 1 hour later
                  if (selectedDate >= endTime) {
                    setEndTime(new Date(selectedDate.getTime() + 60 * 60 * 1000));
                  }
                }
              }}
              style={styles.datePicker}
            />
          </View>
        </View>
      </Modal>

      {/* End Time Picker Modal */}
      <Modal
        visible={showEndPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEndPicker(false)}
      >
        <View style={styles.datePickerModalOverlay}>
          <TouchableOpacity
            style={styles.datePickerModalBackground}
            activeOpacity={1}
            onPress={() => setShowEndPicker(false)}
          />
          <View style={[styles.datePickerContainer, { backgroundColor: theme.surface }]}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                <Text style={[styles.datePickerButton, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.datePickerTitle, { color: theme.text }]}>Select End Time</Text>
              <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                <Text style={[styles.datePickerButton, { color: '#10B981' }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={endTime}
              mode={allDay ? "date" : "datetime"}
              display="spinner"
              minimumDate={startTime}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setEndTime(selectedDate);
                }
              }}
              style={styles.datePicker}
            />
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 100,
  },
  allDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reminderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  reminderOption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  reminderOptionText: {
    fontWeight: '500',
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  allDayBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  allDayBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
  },
  previewTime: {
    fontSize: 14,
    marginBottom: 8,
  },
  previewLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  previewLocationText: {
    fontSize: 14,
  },
  previewReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewReminderText: {
    fontSize: 14,
  },
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerModalBackground: {
    flex: 1,
  },
  datePickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    alignItems: 'center',
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '100%',
    borderBottomWidth: 0.2,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  datePickerButton: {
    fontSize: 17,
    fontWeight: '400',
  },
  datePicker: {
    backgroundColor: 'transparent',
    width: '100%',
  },
});

export default AddEventScreen;
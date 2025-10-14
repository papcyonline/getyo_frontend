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
import { addReminder } from '../store/slices/reminderSlice';

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

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    const newReminder = {
      id: Date.now().toString(),
      userId: 'current-user', // TODO: Get from user context/auth
      title: title.trim(),
      notes: notes.trim(),
      reminderTime: reminderTime.toISOString(),
      repeatType,
      isUrgent,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch(addReminder(newReminder));
    Alert.alert('Success', 'Reminder set successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const getRepeatColor = (type: string) => {
    return repeatType === type ? '#FFF7F5' : 'transparent';
  };

  const getRepeatTextColor = (type: string) => {
    return repeatType === type ? '#FFF7F5' : theme.text;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Set Reminder</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Reminder Title</Text>
          <TextInput
            style={[styles.titleInput, {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="What would you like to be reminded about?"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Reminder Time</Text>
          <TouchableOpacity
            style={[styles.timeButton, {
              backgroundColor: theme.surface,
              borderColor: theme.border
            }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="alarm-outline" size={24} color="#FF4757" />
            <View style={styles.timeContent}>
              <Text style={[styles.timeText, { color: theme.text }]}>
                {reminderTime.toLocaleString()}
              </Text>
              <Text style={[styles.timeSubtext, { color: theme.textSecondary }]}>
                Tap to change time
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Repeat Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Repeat</Text>
          <View style={styles.repeatContainer}>
            {[
              { type: 'none', label: 'Once' },
              { type: 'daily', label: 'Daily' },
              { type: 'weekly', label: 'Weekly' },
              { type: 'monthly', label: 'Monthly' }
            ].map(({ type, label }) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.repeatButton,
                  {
                    backgroundColor: getRepeatColor(type),
                    borderColor: repeatType === type ? '#FFF7F5' : theme.border
                  }
                ]}
                onPress={() => setRepeatType(type as any)}
              >
                <Text style={[
                  styles.repeatText,
                  { color: getRepeatTextColor(type) }
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Urgent Toggle */}
        <View style={styles.section}>
          <View style={styles.urgentHeader}>
            <View style={styles.urgentInfo}>
              <View style={styles.urgentIcon}>
                <Ionicons name="warning" size={20} color="#FF4757" />
              </View>
              <View>
                <Text style={[styles.urgentTitle, { color: theme.text }]}>Urgent Reminder</Text>
                <Text style={[styles.urgentSubtext, { color: theme.textSecondary }]}>
                  Play sound and vibrate even in silent mode
                </Text>
              </View>
            </View>
            <Switch
              value={isUrgent}
              onValueChange={setIsUrgent}
              trackColor={{ false: theme.border, true: '#FF4757' }}
              thumbColor={isUrgent ? '#FFF7F5' : theme.textSecondary}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes (Optional)</Text>
          <TextInput
            style={[styles.notesInput, {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Add any additional notes..."
            placeholderTextColor={theme.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={300}
          />
        </View>

        {/* Preview Card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Preview</Text>
          <View style={[styles.previewCard, {
            backgroundColor: theme.surface,
            borderColor: isUrgent ? '#FF4757' : theme.border
          }]}>
            <View style={styles.previewHeader}>
              <Ionicons name="alarm" size={20} color="#FF4757" />
              <Text style={[styles.previewTitle, { color: theme.text }]}>
                {title || 'Reminder Title'}
              </Text>
              {isUrgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>URGENT</Text>
                </View>
              )}
            </View>
            <Text style={[styles.previewTime, { color: theme.textSecondary }]}>
              {reminderTime.toLocaleString()} • {repeatType === 'none' ? 'Once' : `Repeats ${repeatType}`}
            </Text>
            {notes && (
              <Text style={[styles.previewNotes, { color: theme.textSecondary }]}>
                {notes}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.datePickerModalOverlay}>
          <TouchableOpacity
            style={styles.datePickerModalBackground}
            activeOpacity={1}
            onPress={() => setShowTimePicker(false)}
          />
          <View style={[styles.datePickerContainer, { backgroundColor: theme.surface }]}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={[styles.datePickerButton, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.datePickerTitle, { color: theme.text }]}>Select Reminder Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={[styles.datePickerButton, { color: '#FF4757' }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={reminderTime}
              mode="datetime"
              display="spinner"
              onChange={(event, selectedTime) => {
                if (selectedTime) {
                  setReminderTime(selectedTime);
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
    backgroundColor: '#FF4757',
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
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  timeContent: {
    flex: 1,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeSubtext: {
    fontSize: 14,
  },
  repeatContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  repeatButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  repeatText: {
    fontWeight: '500',
  },
  urgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urgentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  urgentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  urgentSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 100,
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
  urgentBadge: {
    backgroundColor: '#FF4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgentBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
  },
  previewTime: {
    fontSize: 14,
    marginBottom: 8,
  },
  previewNotes: {
    fontSize: 14,
    lineHeight: 20,
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

export default AddReminderScreen;
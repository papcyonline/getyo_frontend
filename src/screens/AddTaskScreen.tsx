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
import { addTask } from '../store/slices/taskSlice';
import { notificationService } from '../services/notificationService';

const AddTaskScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      userId: 'current-user', // TODO: Get from user context/auth
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'pending' as const,
      dueDate: dueDate?.toISOString(),
      reminders: hasReminder ? [reminderTime.toISOString()] : [],
      tags: [], // TODO: Add tag functionality
      createdBy: 'user' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch(addTask(newTask));

    // Schedule notification if reminder is set
    if (hasReminder && dueDate) {
      try {
        await notificationService.scheduleTaskDeadlineReminder(
          newTask.id,
          title.trim(),
          dueDate,
          priority === 'high'
        );
        console.log('✅ Task notification scheduled for:', reminderTime.toLocaleString());
      } catch (error) {
        console.error('❌ Failed to schedule notification:', error);
      }
    }

    Alert.alert('Success', 'Task created successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return '#FF4757';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#FFFFFF';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Task</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Task Title</Text>
          <TextInput
            style={[styles.titleInput, {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Enter task title"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Description (Optional)</Text>
          <TextInput
            style={[styles.descriptionInput, {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Enter task description"
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Priority</Text>
          <View style={styles.priorityContainer}>
            {['low', 'medium', 'high'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  priority === p && {
                    backgroundColor: getPriorityColor(p),
                    borderColor: getPriorityColor(p)
                  }
                ]}
                onPress={() => setPriority(p as any)}
              >
                <Text style={[
                  styles.priorityText,
                  { color: theme.text },
                  priority === p && { color: '#FFFFFF' }
                ]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Due Date (Optional)</Text>
          <TouchableOpacity
            style={[styles.dateButton, {
              backgroundColor: theme.surface,
              borderColor: theme.border
            }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.dateButtonText, { color: theme.text }]}>
              {dueDate ? dueDate.toLocaleDateString() : 'Select due date'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reminder */}
        <View style={styles.section}>
          <View style={styles.reminderHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Set Reminder</Text>
            <Switch
              value={hasReminder}
              onValueChange={setHasReminder}
              trackColor={{ false: theme.border, true: '#FFFFFF' }}
              thumbColor={hasReminder ? '#FFFFFF' : theme.textSecondary}
            />
          </View>
          {hasReminder && (
            <TouchableOpacity
              style={[styles.dateButton, {
                backgroundColor: theme.surface,
                borderColor: theme.border
              }]}
              onPress={() => setShowReminderPicker(true)}
            >
              <Ionicons name="alarm-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.dateButtonText, { color: theme.text }]}>
                {reminderTime.toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerModalOverlay}>
          <TouchableOpacity
            style={styles.datePickerModalBackground}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          />
          <View style={[styles.datePickerContainer, { backgroundColor: theme.surface }]}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={[styles.datePickerButton, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.datePickerTitle, { color: theme.text }]}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={[styles.datePickerButton, { color: '#FFFFFF' }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setDueDate(selectedDate);
                }
              }}
              style={styles.datePicker}
            />
          </View>
        </View>
      </Modal>

      {/* Reminder Time Picker Modal */}
      <Modal
        visible={showReminderPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReminderPicker(false)}
      >
        <View style={styles.datePickerModalOverlay}>
          <TouchableOpacity
            style={styles.datePickerModalBackground}
            activeOpacity={1}
            onPress={() => setShowReminderPicker(false)}
          />
          <View style={[styles.datePickerContainer, { backgroundColor: theme.surface }]}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowReminderPicker(false)}>
                <Text style={[styles.datePickerButton, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.datePickerTitle, { color: theme.text }]}>Select Reminder Time</Text>
              <TouchableOpacity onPress={() => setShowReminderPicker(false)}>
                <Text style={[styles.datePickerButton, { color: '#FFFFFF' }]}>Done</Text>
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
    backgroundColor: '#FFFFFF',
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
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 100,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  priorityText: {
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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

export default AddTaskScreen;
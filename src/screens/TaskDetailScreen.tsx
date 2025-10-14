import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';

const { width } = Dimensions.get('window');

interface TaskDetailScreenProps {
  route: any;
  navigation: any;
}

const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({ route, navigation }) => {
  const { taskId } = route.params || {};

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [dueDate, setDueDate] = useState(new Date());
  const [category, setCategory] = useState('Work');
  const [subtasks, setSubtasks] = useState<Array<{id: string; title: string; completed: boolean}>>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (taskId) {
      setTitle('Review quarterly financial reports');
      setDescription('Go through Q4 financial reports and prepare summary for board meeting. Focus on revenue growth, expense management, and cash flow analysis.');
      setPriority('high');
      setStatus('in_progress');
      setDueDate(new Date(Date.now() + 7200000));
      setCategory('Finance');
      setSubtasks([
        { id: '1', title: 'Download all financial reports', completed: true },
        { id: '2', title: 'Analyze revenue trends', completed: true },
        { id: '3', title: 'Review expense breakdown', completed: false },
        { id: '4', title: 'Prepare executive summary', completed: false },
        { id: '5', title: 'Create presentation slides', completed: false },
      ]);
    }
  }, [taskId]);

  const getTimeUrgency = () => {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const hoursRemaining = diff / 3600000;

    if (hoursRemaining < 0) return { color: '#EF4444', label: 'OVERDUE' };
    if (hoursRemaining < 2) return { color: '#EF4444', label: 'DUE SOON' };
    if (hoursRemaining < 24) return { color: '#F59E0B', label: 'DUE TODAY' };
    return { color: '#10B981', label: 'ON TRACK' };
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const handleSave = async () => {
    try {
      Alert.alert('Success', 'Task updated successfully');
      setIsEditing(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const toggleSubtask = (id: string) => {
    if (isEditing) {
      setSubtasks(subtasks.map(st =>
        st.id === id ? { ...st, completed: !st.completed } : st
      ));
    }
  };

  const urgency = getTimeUrgency();
  const completedSubtasks = subtasks.filter(st => st.completed).length;

  return (
    <LinearGradient
      colors={['#1E3A5F', '#0C2340', '#051829', '#000000', '#000000', '#000000']}
      locations={[0, 0.2, 0.35, 0.5, 0.75, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title || 'Task Details'}</Text>
          <View style={styles.headerMeta}>
            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor() }]} />
            <Text style={styles.headerSubtitle}>{category}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={[styles.editButton, isEditing && styles.editButtonActive]}
        >
          <Ionicons name={isEditing ? "checkmark" : "create-outline"} size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Status Card */}
        <LiquidGlassView
          style={[styles.heroCard, !isLiquidGlassSupported && { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
          interactive
          effect="clear"
        >
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>{title}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={urgency.color} />
                <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.label}</Text>
              </View>
            </View>
            <View style={styles.heroRight}>
              <View style={[styles.statusBadge, { backgroundColor: getPriorityColor() }]}>
                <Text style={styles.statusBadgeText}>{priority.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.dueSection}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.dueDate}>
              {dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {dueDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </Text>
          </View>

          {subtasks.length > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressCount}>{completedSubtasks}/{subtasks.length}</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(completedSubtasks / subtasks.length) * 100}%`,
                      backgroundColor: getPriorityColor()
                    }
                  ]}
                />
              </View>
            </View>
          )}
        </LiquidGlassView>

        {/* Description Card */}
        {(description || isEditing) && (
          <LiquidGlassView
            style={[styles.card, !isLiquidGlassSupported && { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
            interactive
            effect="clear"
          >
            <View style={styles.cardHeader}>
              <Ionicons name="document-text-outline" size={18} color="#6B7280" />
              <Text style={styles.cardTitle}>Description</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="Add a description..."
                placeholderTextColor="#4B5563"
                multiline
              />
            ) : (
              <Text style={styles.cardDescription}>{description || 'No description'}</Text>
            )}
          </LiquidGlassView>
        )}

        {/* Subtasks Card */}
        {subtasks.length > 0 && (
          <LiquidGlassView
            style={[styles.card, !isLiquidGlassSupported && { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
            interactive
            effect="clear"
          >
            <View style={styles.cardHeader}>
              <Ionicons name="list-outline" size={18} color="#6B7280" />
              <Text style={styles.cardTitle}>Subtasks</Text>
            </View>
            <View style={styles.subtasksList}>
              {subtasks.map((subtask, index) => (
                <TouchableOpacity
                  key={subtask.id}
                  style={[
                    styles.subtaskItem,
                    index === subtasks.length - 1 && styles.subtaskItemLast
                  ]}
                  onPress={() => toggleSubtask(subtask.id)}
                  disabled={!isEditing}
                >
                  <View style={[styles.subtaskCheck, subtask.completed && styles.subtaskCheckDone]}>
                    {subtask.completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                  <Text style={[styles.subtaskTitle, subtask.completed && styles.subtaskTitleDone]}>
                    {subtask.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </LiquidGlassView>
        )}

        {/* Edit Mode Cards */}
        {isEditing && (
          <>
            {/* Priority & Status */}
            <LiquidGlassView
              style={[styles.card, !isLiquidGlassSupported && { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
              interactive
              effect="clear"
            >
              <View style={styles.cardHeader}>
                <Ionicons name="flag-outline" size={18} color="#6B7280" />
                <Text style={styles.cardTitle}>Priority & Status</Text>
              </View>
              <View style={styles.editRow}>
                <View style={styles.editColumn}>
                  <Text style={styles.editLabel}>Priority</Text>
                  <View style={styles.chipGroup}>
                    {(['low', 'medium', 'high'] as const).map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.chip,
                          priority === p && { backgroundColor: getPriorityColor(), borderColor: getPriorityColor() }
                        ]}
                        onPress={() => setPriority(p)}
                      >
                        <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={[styles.editRow, { marginTop: 16 }]}>
                <View style={styles.editColumn}>
                  <Text style={styles.editLabel}>Status</Text>
                  <View style={styles.chipGroup}>
                    {(['pending', 'in_progress', 'completed'] as const).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.chip,
                          status === s && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' }
                        ]}
                        onPress={() => setStatus(s)}
                      >
                        <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
                          {s.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </LiquidGlassView>

            {/* Due Date & Category */}
            <LiquidGlassView
              style={[styles.card, !isLiquidGlassSupported && { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
              interactive
              effect="clear"
            >
              <View style={styles.cardHeader}>
                <Ionicons name="settings-outline" size={18} color="#6B7280" />
                <Text style={styles.cardTitle}>Settings</Text>
              </View>
              <TouchableOpacity style={styles.settingItem} onPress={() => setShowDatePicker(true)}>
                <View style={styles.settingLeft}>
                  <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Due Date</Text>
                    <Text style={styles.settingValue}>
                      {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4B5563" />
              </TouchableOpacity>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="pricetag-outline" size={20} color="#9CA3AF" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Category</Text>
                    <TextInput
                      style={styles.categoryInput}
                      value={category}
                      onChangeText={setCategory}
                      placeholder="Enter category"
                      placeholderTextColor="#4B5563"
                    />
                  </View>
                </View>
              </View>
            </LiquidGlassView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={styles.deleteBtnText}>Delete Task</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDueDate(selectedDate);
            }}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonActive: {
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroLeft: {
    flex: 1,
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urgencyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  dueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  dueDate: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  cardDescription: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  textArea: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  subtasksList: {
    gap: 0,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  subtaskItemLast: {
    borderBottomWidth: 0,
  },
  subtaskCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtaskCheckDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 15,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  subtaskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  editRow: {
    marginBottom: 0,
  },
  editColumn: {
    flex: 1,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 10,
  },
  chipGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  chipTextActive: {
    color: '#FFF',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
  },
  categoryInput: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
    padding: 0,
    margin: 0,
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F0F0F',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default TaskDetailScreen;

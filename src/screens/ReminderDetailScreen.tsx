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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';

interface ReminderDetailScreenProps {
  route: any;
  navigation: any;
}

const ReminderDetailScreen: React.FC<ReminderDetailScreenProps> = ({ route, navigation }) => {
  const { reminderId } = route.params || {};

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [importance, setImportance] = useState<'low' | 'medium' | 'high'>('medium');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [category, setCategory] = useState('');
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (reminderId) {
      setTitle('Submit Q4 expense report');
      setDescription('Submit quarterly expense report including all receipts, mileage logs, and travel expenses to finance department.');
      setNotes('Remember to include the client dinner receipts from last month and the conference travel expenses.');
      setReminderTime(new Date(Date.now() + 10800000)); // 3 hours from now
      setImportance('high');
      setIsRecurring(true);
      setRecurringType('weekly');
      setCategory('Finance');
      setSnoozeCount(2);
      setIsDismissed(false);
    }
  }, [reminderId]);

  const getTimeUrgency = () => {
    const now = new Date();
    const diff = reminderTime.getTime() - now.getTime();
    const hoursRemaining = diff / 3600000;

    if (hoursRemaining < 0) return { color: '#EF4444', label: 'OVERDUE' };
    if (hoursRemaining < 0.5) return { color: '#EF4444', label: 'DUE NOW' };
    if (hoursRemaining < 2) return { color: '#F59E0B', label: 'COMING UP' };
    if (hoursRemaining < 24) return { color: '#F59E0B', label: 'DUE TODAY' };
    return { color: '#10B981', label: 'SCHEDULED' };
  };

  const getImportanceColor = () => {
    switch (importance) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const handleSave = async () => {
    try {
      Alert.alert('Success', 'Reminder updated successfully');
      setIsEditing(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const handleDismiss = async () => {
    Alert.alert(
      'Dismiss Reminder',
      'Mark this reminder as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          onPress: () => {
            setIsDismissed(true);
            setTimeout(() => navigation.goBack(), 1500);
          },
        },
      ]
    );
  };

  const handleSnooze = () => {
    Alert.alert(
      'Snooze Reminder',
      'How long would you like to snooze?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '10 minutes',
          onPress: () => {
            const newTime = new Date(reminderTime.getTime() + 600000);
            setReminderTime(newTime);
            setSnoozeCount(snoozeCount + 1);
            Alert.alert('Snoozed', 'Reminder snoozed for 10 minutes');
          },
        },
        {
          text: '1 hour',
          onPress: () => {
            const newTime = new Date(reminderTime.getTime() + 3600000);
            setReminderTime(newTime);
            setSnoozeCount(snoozeCount + 1);
            Alert.alert('Snoozed', 'Reminder snoozed for 1 hour');
          },
        },
      ]
    );
  };

  const urgency = getTimeUrgency();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#000000', '#0A0A0A']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title || 'Reminder Details'}</Text>
          <View style={styles.headerMeta}>
            <View style={[styles.importanceDot, { backgroundColor: getImportanceColor() }]} />
            <Text style={styles.headerSubtitle}>{category || importance.toUpperCase()}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={[styles.editButton, isEditing && styles.editButtonActive]}
        >
          <Ionicons name={isEditing ? "checkmark" : "create-outline"} size={20} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dismissed Banner */}
        {isDismissed && (
          <View style={styles.dismissedBanner}>
            <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            <Text style={styles.dismissedText}>Reminder Dismissed</Text>
          </View>
        )}

        {/* Hero Status Card */}
        {!isDismissed && (
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroTitle}>{title}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="alarm-outline" size={14} color={urgency.color} />
                  <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.label}</Text>
                </View>
              </View>
              <View style={styles.heroRight}>
                <View style={[styles.statusBadge, { backgroundColor: getImportanceColor() }]}>
                  <Text style={styles.statusBadgeText}>{importance.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            <View style={styles.timeSection}>
              <Ionicons name="time" size={16} color="#6B7280" />
              <Text style={styles.timeText}>
                {reminderTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {reminderTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
              </Text>
            </View>

            {/* Meta Info */}
            <View style={styles.metaInfoRow}>
              <View style={styles.metaItem}>
                <Ionicons name="flag" size={16} color={getImportanceColor()} />
                <Text style={styles.metaText}>{importance.toUpperCase()}</Text>
              </View>
              {isRecurring && (
                <View style={styles.metaItem}>
                  <Ionicons name="repeat" size={16} color="#8B5CF6" />
                  <Text style={styles.metaText}>{recurringType.toUpperCase()}</Text>
                </View>
              )}
              {category && (
                <View style={styles.metaItem}>
                  <Ionicons name="folder" size={16} color="#3B82F6" />
                  <Text style={styles.metaText}>{category}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {!isDismissed && !isEditing && (
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
              <Ionicons name="time-outline" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Snooze</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Snooze Info */}
        {snoozeCount > 0 && !isDismissed && (
          <View style={styles.snoozeInfo}>
            <Ionicons name="notifications-off" size={16} color="#F59E0B" />
            <Text style={styles.snoozeText}>
              Snoozed {snoozeCount} time{snoozeCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Description Card */}
        {(description || isEditing) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text-outline" size={18} color="#6B7280" />
              <Text style={styles.cardTitle}>Description</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="Add description"
                placeholderTextColor="#4B5563"
                multiline
              />
            ) : (
              <Text style={styles.cardDescription}>{description || 'No description'}</Text>
            )}
          </View>
        )}

        {/* Notes Card */}
        {(notes || isEditing) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="clipboard-outline" size={18} color="#6B7280" />
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.textArea}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes"
                placeholderTextColor="#4B5563"
                multiline
              />
            ) : (
              <Text style={styles.cardDescription}>{notes || 'No notes'}</Text>
            )}
          </View>
        )}

        {/* Edit Mode Cards */}
        {isEditing && (
          <>
            {/* Reminder Time */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="time-outline" size={18} color="#6B7280" />
                <Text style={styles.cardTitle}>Reminder Time</Text>
              </View>
              <TouchableOpacity style={styles.settingItem} onPress={() => setShowTimePicker(true)}>
                <View style={styles.settingLeft}>
                  <Ionicons name="alarm-outline" size={20} color="#9CA3AF" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Time</Text>
                    <Text style={styles.settingValue}>
                      {reminderTime.toLocaleDateString()} {reminderTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Importance & Priority */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="flag-outline" size={18} color="#6B7280" />
                <Text style={styles.cardTitle}>Importance</Text>
              </View>
              <View style={styles.chipGroup}>
                {(['low', 'medium', 'high'] as const).map((imp) => (
                  <TouchableOpacity
                    key={imp}
                    style={[
                      styles.chip,
                      importance === imp && { backgroundColor: getImportanceColor(), borderColor: getImportanceColor() }
                    ]}
                    onPress={() => setImportance(imp)}
                  >
                    <Text style={[styles.chipText, importance === imp && styles.chipTextActive]}>
                      {imp.charAt(0).toUpperCase() + imp.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recurring Settings */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="repeat-outline" size={18} color="#6B7280" />
                <Text style={styles.cardTitle}>Recurring</Text>
              </View>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="refresh-outline" size={20} color="#9CA3AF" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Repeat</Text>
                    <Text style={styles.settingValue}>{isRecurring ? 'Enabled' : 'Disabled'}</Text>
                  </View>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: '#374151', true: '#3B82F6' }}
                  thumbColor={isRecurring ? '#FFF' : '#9CA3AF'}
                />
              </View>
              {isRecurring && (
                <View style={[styles.chipGroup, { marginTop: 12 }]}>
                  {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.chip,
                        recurringType === type && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' }
                      ]}
                      onPress={() => setRecurringType(type)}
                    >
                      <Text style={[styles.chipText, recurringType === type && styles.chipTextActive]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Category */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="folder-outline" size={18} color="#6B7280" />
                <Text style={styles.cardTitle}>Category</Text>
              </View>
              <TextInput
                style={styles.categoryInput}
                value={category}
                onChangeText={setCategory}
                placeholder="Enter category"
                placeholderTextColor="#4B5563"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={styles.deleteBtnText}>Delete Reminder</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {showTimePicker && (
          <DateTimePicker
            value={reminderTime}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              setShowTimePicker(false);
              if (selectedDate) setReminderTime(selectedDate);
            }}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
    
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
    gap: 6,
  },
  importanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
  dismissedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#0F0F0F',
    paddingVertical: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  dismissedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  heroCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  metaInfoRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#0F0F0F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
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
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  snoozeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  snoozeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F0F0F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  snoozeText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
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
  categoryInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 15,
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

export default ReminderDetailScreen;

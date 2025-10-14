import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';

interface EventDetailScreenProps {
  route: any;
  navigation: any;
}

const EventDetailScreen: React.FC<EventDetailScreenProps> = ({ route, navigation }) => {
  const { eventId } = route.params || {};

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [address, setAddress] = useState('');
  const [attendees, setAttendees] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [travelTime, setTravelTime] = useState('25 min');
  const [distance, setDistance] = useState('8.2 mi');

  useEffect(() => {
    if (eventId) {
      const now = Date.now();
      setTitle('Board Meeting - Q4 Review');
      setDescription('Quarterly board meeting to review Q4 performance, discuss 2024 strategy, and approve budget allocations. Please bring financial reports and strategic proposals.');
      setStartTime(new Date(now + 5400000)); // 1.5 hours from now
      setEndTime(new Date(now + 9000000)); // 2.5 hours from now
      setAddress('123 Corporate Plaza, Suite 400, Downtown Business District, San Francisco, CA 94105');
      setAttendees(['Sarah Johnson', 'Michael Chen', 'David Brown', 'Emma Wilson', 'Alex Garcia']);
      setTravelTime('25 min');
      setDistance('8.2 mi');
    }
  }, [eventId]);

  const getTimeUrgency = () => {
    const now = new Date();
    const diff = startTime.getTime() - now.getTime();
    const hoursRemaining = diff / 3600000;

    if (hoursRemaining < 0) return { color: '#EF4444', label: 'IN PROGRESS' };
    if (hoursRemaining < 1) return { color: '#EF4444', label: 'STARTING SOON' };
    if (hoursRemaining < 2) return { color: '#F59E0B', label: 'COMING UP' };
    return { color: '#10B981', label: 'SCHEDULED' };
  };

  const getDepartureTime = () => {
    const travelMinutes = parseInt(travelTime) || 25;
    const bufferMinutes = 10;
    return new Date(startTime.getTime() - (travelMinutes + bufferMinutes) * 60000);
  };

  const getDuration = () => {
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const openMaps = () => {
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps://app?daddr=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    });

    Linking.openURL(url!).catch(() =>
      Alert.alert('Error', 'Unable to open maps')
    );
  };

  const handleSave = async () => {
    try {
      Alert.alert('Success', 'Event updated successfully');
      setIsEditing(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update event');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const urgency = getTimeUrgency();
  const departureTime = getDepartureTime();

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
          <Text style={styles.headerTitle}>{title || 'Event Details'}</Text>
          <View style={styles.headerMeta}>
            <Ionicons name="calendar" size={14} color="#3B82F6" />
            <Text style={styles.headerSubtitle}>{getDuration()}</Text>
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
              <View style={[styles.statusBadge, { backgroundColor: urgency.color }]}>
                <Text style={styles.statusBadgeText}>{urgency.label}</Text>
              </View>
            </View>
          </View>

          <View style={styles.timeSection}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.timeText}>
              {startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
            <Text style={styles.timeDivider}>•</Text>
            <Text style={styles.timeText}>
              {startTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - {endTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </Text>
          </View>

          {/* Meta Info */}
          <View style={styles.metaInfoRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={16} color="#3B82F6" />
              <Text style={styles.metaText}>{getDuration()}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={16} color="#8B5CF6" />
              <Text style={styles.metaText}>{attendees.length} Attendees</Text>
            </View>
            {address && (
              <View style={styles.metaItem}>
                <Ionicons name="location" size={16} color="#EF4444" />
                <Text style={styles.metaText}>{distance}</Text>
              </View>
            )}
          </View>
        </LiquidGlassView>

        {/* Location Map Card */}
        {address && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location-sharp" size={18} color="#6B7280" />
              <Text style={styles.cardTitle}>Location</Text>
            </View>

            <View style={styles.mapContainer}>
              {/* Static Map Placeholder */}
              <View style={styles.mapPlaceholder}>
                <Ionicons name="location" size={48} color="#3B82F6" />
                <Text style={styles.mapText}>Location Map</Text>
              </View>
            </View>

            <Text style={styles.addressText}>{address}</Text>

            {/* Travel Info */}
            <View style={styles.travelInfo}>
              <View style={styles.travelItem}>
                <Ionicons name="car" size={18} color="#F59E0B" />
                <View>
                  <Text style={styles.travelLabel}>Travel Time</Text>
                  <Text style={styles.travelValue}>{travelTime}</Text>
                </View>
              </View>
              <View style={styles.travelItem}>
                <Ionicons name="time-outline" size={18} color="#10B981" />
                <View>
                  <Text style={styles.travelLabel}>Leave By</Text>
                  <Text style={styles.travelValue}>
                    {departureTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </Text>
                </View>
              </View>
            </View>

            {/* Directions Button */}
            <TouchableOpacity style={styles.directionsButton} onPress={openMaps}>
              <Ionicons name="navigate" size={20} color="#FFF" />
              <Text style={styles.directionsText}>Get Directions</Text>
            </TouchableOpacity>
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

        {/* Attendees Card */}
        {attendees.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="people-outline" size={18} color="#6B7280" />
              <Text style={styles.cardTitle}>Attendees ({attendees.length})</Text>
            </View>
            <View style={styles.attendeesList}>
              {attendees.map((attendee, index) => (
                <View
                  key={index}
                  style={[
                    styles.attendeeItem,
                    index === attendees.length - 1 && styles.attendeeItemLast
                  ]}
                >
                  <View style={styles.attendeeAvatar}>
                    <Text style={styles.attendeeInitial}>{attendee.charAt(0)}</Text>
                  </View>
                  <Text style={styles.attendeeName}>{attendee}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Edit Mode Cards */}
        {isEditing && (
          <>
            {/* Event Time */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="time-outline" size={18} color="#6B7280" />
                <Text style={styles.cardTitle}>Event Time</Text>
              </View>
              <TouchableOpacity style={styles.settingItem} onPress={() => setShowDatePicker(true)}>
                <View style={styles.settingLeft}>
                  <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Start Time</Text>
                    <Text style={styles.settingValue}>
                      {startTime.toLocaleDateString()} {startTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Location */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="location-outline" size={18} color="#6B7280" />
                <Text style={styles.cardTitle}>Location</Text>
              </View>
              <TextInput
                style={styles.locationInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Add location"
                placeholderTextColor="#4B5563"
                multiline
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
                <Text style={styles.deleteBtnText}>Delete Event</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={startTime}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setStartTime(selectedDate);
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
    gap: 6,
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
  timeDivider: {
    fontSize: 14,
    color: '#4B5563',
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
  mapContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#111111',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  mapText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 16,
  },
  travelInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
  },
  travelItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  travelLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 2,
  },
  travelValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '700',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  directionsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
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
  attendeesList: {
    gap: 0,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  attendeeItemLast: {
    borderBottomWidth: 0,
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#60A5FA',
  },
  attendeeName: {
    fontSize: 15,
    color: '#E5E7EB',
    fontWeight: '500',
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
  locationInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
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

export default EventDetailScreen;

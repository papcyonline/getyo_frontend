import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../store';

const CalendarScreen: React.FC = () => {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const events = useSelector((state: RootState) => state.calendar.events);

  // Mock events for demonstration
  const mockEvents = [
    {
      id: '1',
      title: 'Team Standup',
      startTime: new Date().toISOString(),
      location: 'Conference Room A',
    },
    {
      id: '2',
      title: 'Lunch with Sarah',
      startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      location: 'Downtown Cafe',
    },
    {
      id: '3',
      title: 'Dentist Appointment',
      startTime: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      location: 'Dental Office',
    },
  ];

  const displayEvents = events.length > 0 ? events : mockEvents;

  const renderEvent = ({ item }: { item: any }) => (
    <View style={[styles.eventItem, { backgroundColor: theme.surface }]}>
      <View style={styles.eventTime}>
        <Text style={[styles.timeText, { color: theme.accent }]}>
          {new Date(item.startTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </Text>
      </View>
      <View style={styles.eventContent}>
        <Text style={[styles.eventTitle, { color: theme.text }]}>
          {item.title}
        </Text>
        {item.location && (
          <Text style={[styles.eventLocation, { color: theme.textSecondary }]}>
            📍 {item.location}
          </Text>
        )}
      </View>
    </View>
  );

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Calendar</Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>{today}</Text>
      </View>

      <FlatList
        data={displayEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.eventsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
  },
  eventsList: {
    paddingHorizontal: 24,
  },
  eventItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  eventTime: {
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventContent: {
    flex: 1,
    marginLeft: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
  },
});

export default CalendarScreen;
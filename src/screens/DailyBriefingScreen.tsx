import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';

const DailyBriefingScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('morning');

  const handleBackPress = () => {
    navigation.goBack();
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Mock data for daily briefing
  const briefingData = {
    morning: {
      greeting: 'Good Morning',
      summary: 'You have a busy day ahead with 5 meetings and 3 priority tasks.',
      weather: {
        temp: '72°F',
        condition: 'Partly Cloudy',
        icon: 'partly-sunny-outline',
      },
      topPriorities: [
        { id: '1', title: 'Board Meeting Prep', time: '9:30 AM', urgency: 'critical' },
        { id: '2', title: 'Review Q3 Report', time: '11:00 AM', urgency: 'high' },
        { id: '3', title: 'Client Call - TechCorp', time: '2:00 PM', urgency: 'high' },
      ],
      schedule: [
        { time: '9:30 AM', event: 'Board Meeting Prep', duration: '30 min', type: 'task' },
        { time: '10:00 AM', event: 'Board Meeting', duration: '90 min', type: 'meeting' },
        { time: '11:30 AM', event: 'Email Review', duration: '30 min', type: 'task' },
        { time: '12:00 PM', event: 'Lunch Break', duration: '60 min', type: 'break' },
        { time: '2:00 PM', event: 'Client Call - TechCorp', duration: '60 min', type: 'meeting' },
        { time: '3:30 PM', event: 'Team Standup', duration: '30 min', type: 'meeting' },
        { time: '4:00 PM', event: 'Focus Time', duration: '90 min', type: 'focus' },
      ],
      insights: [
        { icon: 'trending-up', text: 'Your productivity peaks at 10-11 AM. Board meeting is perfectly timed.', color: '#10B981' },
        { icon: 'alert-circle', text: 'Traffic is 20% heavier than usual. Leave 10 minutes early.', color: '#F59E0B' },
        { icon: 'bulb', text: 'You have 2 hours of focus time. Perfect for Q3 report review.', color: '#FFF7F5' },
      ],
      metrics: {
        meetingLoad: 65,
        focusTime: 35,
        taskCompletion: 78,
      },
      news: [
        'Tech stocks up 3% following AI breakthrough announcement',
        'Federal Reserve hints at rate stability in Q4',
        'Major competitor TechCorp announces new product line',
      ],
    },
    evening: {
      greeting: 'Good Evening',
      summary: 'You completed 7 out of 9 tasks today. Great progress!',
      weather: {
        temp: '68°F',
        condition: 'Clear Night',
        icon: 'moon-outline',
      },
      completedToday: [
        { title: 'Board Meeting', result: 'Successful - Action items logged' },
        { title: 'Q3 Report Review', result: 'Completed - 3 revisions needed' },
        { title: 'Client Call', result: 'Positive - Follow-up scheduled' },
      ],
      tomorrowPrep: [
        { id: '1', title: 'Investment Committee Meeting', time: '9:00 AM', preparation: 'Review portfolio performance' },
        { id: '2', title: 'Product Launch Review', time: '11:00 AM', preparation: 'Prepare feedback notes' },
        { id: '3', title: 'One-on-One with Sarah', time: '3:00 PM', preparation: 'Review performance metrics' },
      ],
      insights: [
        { icon: 'checkmark-circle', text: 'You maintained 82% focus during deep work sessions.', color: '#10B981' },
        { icon: 'time', text: 'Average response time to urgent emails: 23 minutes.', color: '#FFF7F5' },
        { icon: 'trophy', text: 'Weekly goal progress: 85% complete.', color: '#F59E0B' },
      ],
      metrics: {
        tasksCompleted: 78,
        meetingEfficiency: 85,
        emailsProcessed: 92,
      },
      reflection: 'Today was highly productive. The board meeting went well, and client relationships strengthened. Consider delegating report revisions to free up tomorrow morning.',
    },
  };

  const currentBriefing = briefingData[selectedTimeframe as keyof typeof briefingData];

  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting': return '#EF4444';
      case 'task': return '#FFF7F5';
      case 'focus': return '#10B981';
      case 'break': return '#F59E0B';
      default: return theme.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Daily Briefing</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Time Toggle */}
      <View style={styles.timeToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedTimeframe === 'morning' && { backgroundColor: '#FFF7F5' }
          ]}
          onPress={() => setSelectedTimeframe('morning')}
        >
          <Ionicons
            name="sunny-outline"
            size={20}
            color={selectedTimeframe === 'morning' ? 'white' : theme.text}
          />
          <Text style={[
            styles.toggleText,
            { color: selectedTimeframe === 'morning' ? 'white' : theme.text }
          ]}>
            Morning
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedTimeframe === 'evening' && { backgroundColor: '#FFF7F5' }
          ]}
          onPress={() => setSelectedTimeframe('evening')}
        >
          <Ionicons
            name="moon-outline"
            size={20}
            color={selectedTimeframe === 'evening' ? 'white' : theme.text}
          />
          <Text style={[
            styles.toggleText,
            { color: selectedTimeframe === 'evening' ? 'white' : theme.text }
          ]}>
            Evening
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF7F5" />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Greeting Card */}
        <View style={styles.greetingHeader}>
            <View>
              <Text style={styles.greetingText}>{currentBriefing.greeting},</Text>
              <Text style={styles.userName}>{user?.name || 'Executive'}</Text>
            </View>
            <View style={styles.weatherInfo}>
              <Ionicons name={currentBriefing.weather.icon as any} size={32} color="white" />
              <Text style={styles.weatherTemp}>{currentBriefing.weather.temp}</Text>
            </View>
          </View>
          <Text style={styles.briefingSummary}>{currentBriefing.summary}</Text>

          {/* Quick Metrics */}
          <View style={styles.quickMetrics}>
            {Object.entries(currentBriefing.metrics).map(([key, value]) => (
              <View key={key} style={styles.metricItem}>
                <Text style={styles.metricValue}>{value}%</Text>
                <Text style={styles.metricLabel}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
              </View>
            ))}
          </View>

        {selectedTimeframe === 'morning' ? (
          <>
            {/* Top Priorities */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Top Priorities
              </Text>
              {currentBriefing.topPriorities.map(priority => (
                <View key={priority.id} style={styles.priorityItem}>
                  <View style={[
                    styles.priorityIndicator,
                    { backgroundColor: priority.urgency === 'critical' ? '#EF4444' : '#F59E0B' }
                  ]} />
                  <View style={styles.priorityContent}>
                    <Text style={[styles.priorityTitle, { color: theme.text }]}>
                      {priority.title}
                    </Text>
                    <Text style={[styles.priorityTime, { color: theme.textSecondary }]}>
                      {priority.time}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </View>
              ))}
            </View>

            {/* Schedule Timeline */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Today's Schedule
              </Text>
              {currentBriefing.schedule.map((item, index) => (
                <View key={index} style={styles.scheduleItem}>
                  <Text style={[styles.scheduleTime, { color: theme.textSecondary }]}>
                    {item.time}
                  </Text>
                  <View style={[styles.scheduleLine, { backgroundColor: getEventColor(item.type) }]} />
                  <View style={styles.scheduleContent}>
                    <Text style={[styles.scheduleEvent, { color: theme.text }]}>
                      {item.event}
                    </Text>
                    <Text style={[styles.scheduleDuration, { color: theme.textSecondary }]}>
                      {item.duration}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Market News */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Market Headlines
              </Text>
              {currentBriefing.news.map((headline, index) => (
                <View key={index} style={styles.newsItem}>
                  <Ionicons name="newspaper-outline" size={16} color="#FFF7F5" />
                  <Text style={[styles.newsText, { color: theme.text }]}>
                    {headline}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Completed Today */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Completed Today
              </Text>
              {currentBriefing.completedToday.map((item, index) => (
                <View key={index} style={styles.completedItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <View style={styles.completedContent}>
                    <Text style={[styles.completedTitle, { color: theme.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.completedResult, { color: theme.textSecondary }]}>
                      {item.result}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Tomorrow Prep */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Prepare for Tomorrow
              </Text>
              {currentBriefing.tomorrowPrep.map(item => (
                <View key={item.id} style={styles.tomorrowItem}>
                  <View style={styles.tomorrowContent}>
                    <Text style={[styles.tomorrowTitle, { color: theme.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.tomorrowTime, { color: '#FFF7F5' }]}>
                      {item.time}
                    </Text>
                    <Text style={[styles.tomorrowPrep, { color: theme.textSecondary }]}>
                      {item.preparation}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Reflection */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <View style={styles.reflectionHeader}>
                <Ionicons name="sparkles" size={16} color="#FFF7F5" />
                <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>
                  AI Reflection
                </Text>
              </View>
              <Text style={[styles.reflectionText, { color: theme.textSecondary }]}>
                {currentBriefing.reflection}
              </Text>
            </View>
          </>
        )}

        {/* Insights */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {user?.assistantName || 'Yo!'} Insights
          </Text>
          {currentBriefing.insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Ionicons name={insight.icon as any} size={20} color={insight.color} />
              <Text style={[styles.insightText, { color: theme.text }]}>
                {insight.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeToggle: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(21, 183, 232, 0.1)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  greetingCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  greetingText: {
    fontSize: 24,
    color: 'white',
    opacity: 0.9,
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  weatherInfo: {
    alignItems: 'center',
  },
  weatherTemp: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 4,
  },
  briefingSummary: {
    fontSize: 16,
    color: 'white',
    opacity: 0.95,
    lineHeight: 22,
    marginBottom: 20,
  },
  quickMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  metricLabel: {
    fontSize: 11,
    color: 'rgba(255, 247, 245, 0.8)',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  priorityContent: {
    flex: 1,
  },
  priorityTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  priorityTime: {
    fontSize: 12,
    marginTop: 2,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleTime: {
    fontSize: 12,
    fontWeight: '500',
    width: 60,
  },
  scheduleLine: {
    width: 3,
    height: 40,
    borderRadius: 1.5,
    marginHorizontal: 12,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleEvent: {
    fontSize: 14,
    fontWeight: '500',
  },
  scheduleDuration: {
    fontSize: 12,
    marginTop: 2,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  newsText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  completedContent: {
    flex: 1,
    marginLeft: 12,
  },
  completedTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  completedResult: {
    fontSize: 12,
    marginTop: 2,
  },
  tomorrowItem: {
    marginBottom: 16,
  },
  tomorrowContent: {
    flex: 1,
  },
  tomorrowTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  tomorrowTime: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  tomorrowPrep: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reflectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default DailyBriefingScreen;
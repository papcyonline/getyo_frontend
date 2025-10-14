import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);

  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Mock data - in real app this would come from backend analytics
  const weeklyStats = {
    tasksCompleted: 47,
    timeSaved: '8.5h',
    meetingsScheduled: 12,
    emailsProcessed: 156,
    aiInteractions: 83,
    productivityScore: 92
  };

  const monthlyStats = {
    tasksCompleted: 189,
    timeSaved: '34h',
    meetingsScheduled: 48,
    emailsProcessed: 624,
    aiInteractions: 332,
    productivityScore: 88
  };

  const currentStats = selectedPeriod === 'week' ? weeklyStats : monthlyStats;

  const insights = [
    {
      title: 'Peak Productivity Hours',
      value: '9:00 AM - 11:00 AM',
      trend: '+15%',
      icon: 'time-outline',
      color: '#FFF7F5'
    },
    {
      title: 'AI Efficiency Gain',
      value: `${currentStats.timeSaved}`,
      trend: '+23%',
      icon: 'flash-outline',
      color: '#10B981'
    },
    {
      title: 'Meeting Success Rate',
      value: '94%',
      trend: '+8%',
      icon: 'people-outline',
      color: '#8B5CF6'
    },
    {
      title: 'Response Time',
      value: '12 min avg',
      trend: '-31%',
      icon: 'arrow-forward-circle-outline',
      color: '#F59E0B'
    }
  ];

  const goals = [
    {
      title: 'Daily Task Completion',
      current: 8,
      target: 10,
      progress: 0.8,
      color: '#FFF7F5'
    },
    {
      title: 'Meeting Efficiency',
      current: 94,
      target: 95,
      progress: 0.99,
      color: '#10B981'
    },
    {
      title: 'Email Zero Inbox',
      current: 3,
      target: 0,
      progress: 0.85,
      color: '#EF4444',
      inverse: true
    }
  ];

  const aiActivities = [
    {
      task: 'Scheduled quarterly review with board',
      time: '2 hours ago',
      type: 'calendar',
      icon: 'calendar-outline',
      color: '#FFF7F5'
    },
    {
      task: 'Drafted follow-up email to client',
      time: '4 hours ago',
      type: 'email',
      icon: 'mail-outline',
      color: '#10B981'
    },
    {
      task: 'Analyzed market research report',
      time: '6 hours ago',
      type: 'analysis',
      icon: 'analytics-outline',
      color: '#8B5CF6'
    },
    {
      task: 'Prepared meeting agenda template',
      time: '1 day ago',
      type: 'documents',
      icon: 'document-text-outline',
      color: '#F59E0B'
    }
  ];

  // Dot pattern for background
  const renderDots = () => {
    const dots = [];
    const rows = 8;
    const dotsPerRow = 8;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < dotsPerRow; col++) {
        dots.push(
          <View
            key={`${row}-${col}`}
            style={[
              styles.dot,
              {
                left: (col * width) / dotsPerRow + (width / dotsPerRow) / 2,
                top: (row * height) / rows + (height / rows) / 2,
              }
            ]}
          />
        );
      }
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      {/* Blue-Black Gradient Background */}
      {/* Dot Pattern */}
      <View style={styles.dotContainer} pointerEvents="none">
        {renderDots()}
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="chevron-back" size={28} color="#FFF7F5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.headerRight}>
          <Ionicons name="download-outline" size={24} color="#FFF7F5" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'week' && { backgroundColor: '#3396D3' }
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[
              styles.periodButtonText,
              { color: selectedPeriod === 'week' ? '#FFF7F5' : 'rgba(255, 247, 245, 0.7)' }
            ]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && { backgroundColor: '#3396D3' }
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[
              styles.periodButtonText,
              { color: selectedPeriod === 'month' ? '#FFF7F5' : 'rgba(255, 247, 245, 0.7)' }
            ]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Productivity Score Card */}
        <View style={styles.scoreCard}>
          
            <View style={styles.scoreContent}>
              <View>
                <Text style={styles.scoreLabel}>Productivity Score</Text>
                <Text style={styles.scoreValue}>{currentStats.productivityScore}</Text>
                <Text style={styles.scoreSubtext}>
                  {currentStats.productivityScore >= 90 ? 'Exceptional' :
                   currentStats.productivityScore >= 80 ? 'Excellent' : 'Good'} Performance
                </Text>
              </View>
              <View style={styles.scoreIcon}>
                <Ionicons name="trending-up" size={32} color="white" />
              </View>
            </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: 'rgba(21, 183, 232, 0.1)' }]}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#FFF7F5" />
              </View>
              <Text style={styles.metricValue}>{currentStats.tasksCompleted}</Text>
              <Text style={styles.metricLabel}>Tasks Completed</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="time-outline" size={24} color="#10B981" />
              </View>
              <Text style={styles.metricValue}>{currentStats.timeSaved}</Text>
              <Text style={styles.metricLabel}>Time Saved</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Ionicons name="calendar-outline" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.metricValue}>{currentStats.meetingsScheduled}</Text>
              <Text style={styles.metricLabel}>Meetings</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="mail-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.metricValue}>{currentStats.emailsProcessed}</Text>
              <Text style={styles.metricLabel}>Emails</Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>

          {insights.map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: `${insight.color}15` }]}>
                <Ionicons name={insight.icon as any} size={20} color={insight.color} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightValue}>{insight.value}</Text>
              </View>
              <View style={[styles.trendBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.trendText}>{insight.trend}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Goals Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals Progress</Text>

          {goals.map((goal, index) => (
            <View key={index} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalValue}>
                  {goal.current}{goal.inverse ? ' left' : ''} / {goal.target}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${goal.progress * 100}%`,
                      backgroundColor: goal.color
                    }
                  ]}
                />
              </View>
              <Text style={[styles.progressPercentage, { color: goal.color }]}>
                {Math.round(goal.progress * 100)}% Complete
              </Text>
            </View>
          ))}
        </View>

        {/* Recent AI Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent AI Activities</Text>

          {aiActivities.map((activity, index) => (
            <View key={index} style={styles.activityCard}>
              <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
                <Ionicons name={activity.icon as any} size={20} color={activity.color} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTask}>{activity.task}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Analytics powered by {user?.assistantName || 'Yo!'} AI
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    zIndex: 1,
  },
  dotContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF7F5',
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
  },
  periodSelector: {
    flexDirection: 'row',
    margin: 16,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 5,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 5,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
  },
  scoreGradient: {
    padding: 24,
  },
  scoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    color: 'rgba(255, 247, 245, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  scoreValue: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreSubtext: {
    color: 'rgba(255, 247, 245, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  scoreIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 247, 245, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#FFF7F5',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  metricCard: {
    width: '50%',
    padding: 8,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#FFF7F5',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 247, 245, 0.7)',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 247, 245, 0.1)',
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
    color: '#FFF7F5',
  },
  insightValue: {
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.7)',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  goalCard: {
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 247, 245, 0.1)',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF7F5',
  },
  goalValue: {
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.7)',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 247, 245, 0.2)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '500',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 247, 245, 0.1)',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTask: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
    color: '#FFF7F5',
  },
  activityTime: {
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.7)',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(255, 247, 245, 0.6)',
  },
  dot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
  },
});

export default AnalyticsScreen;
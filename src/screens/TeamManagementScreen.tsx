import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';

const TeamManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);

  const [selectedTab, setSelectedTab] = useState('team');

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Mock team data
  const teamMembers = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'VP of Engineering',
      department: 'Engineering',
      email: 'sarah.j@company.com',
      status: 'online',
      performance: 92,
      tasksCompleted: 28,
      projects: ['Platform Redesign', 'API v2.0'],
      nextOneOnOne: '2025-09-28',
      workload: 85,
      avatar: 'SJ',
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Senior Developer',
      department: 'Engineering',
      email: 'michael.c@company.com',
      status: 'away',
      performance: 88,
      tasksCompleted: 24,
      projects: ['Mobile App', 'Analytics Dashboard'],
      nextOneOnOne: '2025-09-30',
      workload: 92,
      avatar: 'MC',
    },
    {
      id: '3',
      name: 'Emily Davis',
      role: 'Product Manager',
      department: 'Product',
      email: 'emily.d@company.com',
      status: 'online',
      performance: 94,
      tasksCompleted: 31,
      projects: ['Q4 Roadmap', 'User Research'],
      nextOneOnOne: '2025-09-29',
      workload: 78,
      avatar: 'ED',
    },
    {
      id: '4',
      name: 'David Kim',
      role: 'Marketing Director',
      department: 'Marketing',
      email: 'david.k@company.com',
      status: 'offline',
      performance: 90,
      tasksCompleted: 26,
      projects: ['Brand Refresh', 'Lead Generation'],
      nextOneOnOne: '2025-10-01',
      workload: 82,
      avatar: 'DK',
    },
  ];

  const upcomingOneOnOnes = [
    {
      id: '1',
      employee: 'Emily Davis',
      role: 'Product Manager',
      date: '2025-09-29',
      time: '2:00 PM',
      topics: ['Q4 Planning', 'Career Development', 'Team Collaboration'],
      lastRating: 4.8,
      avatar: 'ED',
    },
    {
      id: '2',
      employee: 'Sarah Johnson',
      role: 'VP of Engineering',
      date: '2025-09-28',
      time: '10:00 AM',
      topics: ['Technical Roadmap', 'Team Growth', 'Process Improvements'],
      lastRating: 4.9,
      avatar: 'SJ',
    },
  ];

  const teamInsights = [
    {
      metric: 'Team Productivity',
      value: '89%',
      trend: 'up',
      change: '+5.2%',
      description: 'Average completion rate across all team members'
    },
    {
      metric: 'Employee Satisfaction',
      value: '4.7/5',
      trend: 'up',
      change: '+0.3',
      description: 'Based on latest quarterly survey'
    },
    {
      metric: 'Retention Rate',
      value: '94%',
      trend: 'stable',
      change: '0%',
      description: '12-month rolling retention rate'
    },
    {
      metric: 'Average Workload',
      value: '84%',
      trend: 'up',
      change: '+2.1%',
      description: 'Capacity utilization across team'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'away': return '#F59E0B';
      case 'offline': return '#6B7280';
      default: return theme.textSecondary;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#F59E0B';
    return '#EF4444';
  };

  const getWorkloadColor = (load: number) => {
    if (load >= 90) return '#EF4444';
    if (load >= 80) return '#F59E0B';
    return '#10B981';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Team Management</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="person-add-outline" size={24} color="#FFF7F5" />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'team' && { borderBottomColor: '#FFF7F5', borderBottomWidth: 2 }
          ]}
          onPress={() => setSelectedTab('team')}
        >
          <Text style={[
            styles.tabText,
            { color: selectedTab === 'team' ? '#FFF7F5' : theme.textSecondary }
          ]}>
            Team Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'meetings' && { borderBottomColor: '#FFF7F5', borderBottomWidth: 2 }
          ]}
          onPress={() => setSelectedTab('meetings')}
        >
          <Text style={[
            styles.tabText,
            { color: selectedTab === 'meetings' ? '#FFF7F5' : theme.textSecondary }
          ]}>
            1-on-1s
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {selectedTab === 'team' ? (
          <>
            {/* Team Insights */}
            <View style={styles.insightsGrid}>
              {teamInsights.map((insight, index) => (
                <View key={index} style={[styles.insightCard, { backgroundColor: theme.surface }]}>
                  <View style={styles.insightHeader}>
                    <Text style={[styles.insightMetric, { color: theme.textSecondary }]}>
                      {insight.metric}
                    </Text>
                    <View style={styles.insightTrend}>
                      <Ionicons
                        name={
                          insight.trend === 'up' ? 'trending-up' :
                          insight.trend === 'down' ? 'trending-down' : 'remove'
                        }
                        size={16}
                        color={
                          insight.trend === 'up' ? '#10B981' :
                          insight.trend === 'down' ? '#EF4444' : '#6B7280'
                        }
                      />
                      <Text style={[
                        styles.insightChange,
                        {
                          color: insight.trend === 'up' ? '#10B981' :
                                 insight.trend === 'down' ? '#EF4444' : '#6B7280'
                        }
                      ]}>
                        {insight.change}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.insightValue, { color: theme.text }]}>
                    {insight.value}
                  </Text>
                  <Text style={[styles.insightDescription, { color: theme.textSecondary }]}>
                    {insight.description}
                  </Text>
                </View>
              ))}
            </View>

            {/* Team Members */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Team Members ({teamMembers.length})
              </Text>

              {teamMembers.map((member, index) => (
                <TouchableOpacity key={member.id} style={styles.memberCard}>
                  <View style={styles.memberHeader}>
                    <View style={styles.memberLeft}>
                      <View style={styles.memberAvatarContainer}>
                        <View style={[styles.memberAvatar, { backgroundColor: '#FFF7F5' }]}>
                          <Text style={styles.memberAvatarText}>{member.avatar}</Text>
                        </View>
                        <View style={[
                          styles.statusIndicator,
                          { backgroundColor: getStatusColor(member.status) }
                        ]} />
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={[styles.memberName, { color: theme.text }]}>
                          {member.name}
                        </Text>
                        <Text style={[styles.memberRole, { color: theme.textSecondary }]}>
                          {member.role} • {member.department}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.memberMetrics}>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                        Performance
                      </Text>
                      <Text style={[
                        styles.metricValue,
                        { color: getPerformanceColor(member.performance) }
                      ]}>
                        {member.performance}%
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                        Tasks Done
                      </Text>
                      <Text style={[styles.metricValue, { color: theme.text }]}>
                        {member.tasksCompleted}
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                        Workload
                      </Text>
                      <Text style={[
                        styles.metricValue,
                        { color: getWorkloadColor(member.workload) }
                      ]}>
                        {member.workload}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.memberProjects}>
                    <Text style={[styles.projectsLabel, { color: theme.textSecondary }]}>
                      Active Projects:
                    </Text>
                    <View style={styles.projectsList}>
                      {member.projects.map((project, projectIndex) => (
                        <View key={projectIndex} style={[styles.projectChip, { backgroundColor: theme.background }]}>
                          <Text style={[styles.projectText, { color: theme.text }]}>
                            {project}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.memberActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={16} color="#FFF7F5" />
                      <Text style={[styles.actionText, { color: '#FFF7F5' }]}>
                        Message
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="calendar-outline" size={16} color="#F59E0B" />
                      <Text style={[styles.actionText, { color: '#F59E0B' }]}>
                        Schedule 1-on-1
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {teamMembers.length > 1 && index < teamMembers.length - 1 && (
                    <View style={[styles.memberDivider, { backgroundColor: theme.border }]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Upcoming 1-on-1s */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Upcoming 1-on-1 Meetings
              </Text>

              {upcomingOneOnOnes.map((meeting, index) => (
                <TouchableOpacity key={meeting.id} style={styles.meetingCard}>
                  <View style={styles.meetingHeader}>
                    <View style={[styles.memberAvatar, { backgroundColor: '#8B5CF6' }]}>
                      <Text style={styles.memberAvatarText}>{meeting.avatar}</Text>
                    </View>
                    <View style={styles.meetingInfo}>
                      <Text style={[styles.meetingEmployee, { color: theme.text }]}>
                        {meeting.employee}
                      </Text>
                      <Text style={[styles.meetingRole, { color: theme.textSecondary }]}>
                        {meeting.role}
                      </Text>
                      <View style={styles.meetingDateTime}>
                        <Ionicons name="calendar-outline" size={14} color="#FFF7F5" />
                        <Text style={[styles.meetingDate, { color: '#FFF7F5' }]}>
                          {meeting.date} at {meeting.time}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={[styles.ratingText, { color: theme.text }]}>
                        {meeting.lastRating}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.meetingTopics}>
                    <Text style={[styles.topicsLabel, { color: theme.textSecondary }]}>
                      Discussion Topics:
                    </Text>
                    {meeting.topics.map((topic, topicIndex) => (
                      <View key={topicIndex} style={styles.topicItem}>
                        <Ionicons name="ellipse" size={6} color="#FFF7F5" />
                        <Text style={[styles.topicText, { color: theme.text }]}>
                          {topic}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* AI Recommendations */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={16} color="#FFF7F5" />
                <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>
                  {user?.assistantName || 'Yo!'} Team Insights
                </Text>
              </View>

              <View style={styles.recommendationItem}>
                <Ionicons name="trending-up" size={20} color="#10B981" />
                <Text style={[styles.recommendationText, { color: theme.text }]}>
                  Sarah's performance is consistently high. Consider discussing leadership opportunities.
                </Text>
              </View>

              <View style={styles.recommendationItem}>
                <Ionicons name="warning" size={20} color="#F59E0B" />
                <Text style={[styles.recommendationText, { color: theme.text }]}>
                  Michael's workload is at 92%. Consider redistributing tasks or adding support.
                </Text>
              </View>

              <View style={styles.recommendationItem}>
                <Ionicons name="people" size={20} color="#8B5CF6" />
                <Text style={[styles.recommendationText, { color: theme.text }]}>
                  Team collaboration score improved 15%. Recognize this achievement in the next all-hands.
                </Text>
              </View>
            </View>
          </>
        )}
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
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  insightCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightMetric: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  insightTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightChange: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 11,
    lineHeight: 14,
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
  memberCard: {
    marginBottom: 20,
  },
  memberHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 13,
  },
  memberMetrics: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 20,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberProjects: {
    marginBottom: 12,
  },
  projectsLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  projectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  projectChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  projectText: {
    fontSize: 11,
    fontWeight: '500',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  memberDivider: {
    height: 0.5,
    marginTop: 16,
  },
  meetingCard: {
    marginBottom: 20,
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  meetingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  meetingEmployee: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  meetingRole: {
    fontSize: 13,
    marginBottom: 6,
  },
  meetingDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetingDate: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  meetingTopics: {
    marginTop: 8,
  },
  topicsLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  topicText: {
    fontSize: 14,
    marginLeft: 8,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    marginLeft: 12,
  },
});

export default TeamManagementScreen;
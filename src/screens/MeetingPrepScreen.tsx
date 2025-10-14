import React, { useState, useEffect } from 'react';
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
import { useSubscription } from '../contexts/SubscriptionContext';
import Paywall from '../components/Paywall';

const MeetingPrepScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);
  const { hasFeature } = useSubscription();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!hasFeature('meeting_prep')) {
      setShowPaywall(true);
    }
  }, [hasFeature]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Mock meeting data
  const upcomingMeetings = [
    {
      id: '1',
      title: 'Board Meeting - Q3 Review',
      time: '10:00 AM - 11:30 AM',
      timeUntil: 'in 30 minutes',
      location: 'Conference Room A',
      type: 'in-person',
      priority: 'critical',
      attendees: [
        { name: 'John Smith', role: 'CEO', linkedin: 'johnsmith', prepared: true },
        { name: 'Sarah Johnson', role: 'CFO', linkedin: 'sarahjohnson', prepared: true },
        { name: 'Michael Chen', role: 'CTO', linkedin: 'michaelchen', prepared: false },
      ],
      agenda: [
        { item: 'Q3 Financial Performance', duration: '20 min', owner: 'Sarah Johnson', status: 'prepared' },
        { item: 'Product Roadmap Update', duration: '15 min', owner: 'Michael Chen', status: 'in-progress' },
        { item: 'Market Expansion Strategy', duration: '25 min', owner: 'You', status: 'prepared' },
        { item: 'Risk Assessment', duration: '15 min', owner: 'John Smith', status: 'pending' },
      ],
      documents: [
        { name: 'Q3 Financial Report.pdf', size: '2.4 MB', uploaded: '2 hours ago' },
        { name: 'Market Analysis.pptx', size: '5.1 MB', uploaded: '1 hour ago' },
        { name: 'Product Roadmap.xlsx', size: '1.2 MB', uploaded: '3 hours ago' },
      ],
      talkingPoints: [
        'Highlight 23% revenue growth in Q3',
        'Address supply chain concerns raised last meeting',
        'Propose 15% budget increase for R&D',
        'Discuss competitive positioning vs TechCorp',
      ],
      aiInsights: {
        sentiment: 'positive',
        keyRisks: ['Supply chain delays', 'Competitor product launch'],
        opportunities: ['Partnership with DataCo', 'Emerging markets expansion'],
        preparation: 85,
      },
    },
    {
      id: '2',
      title: 'Client Strategy Session',
      time: '2:00 PM - 3:00 PM',
      timeUntil: 'in 4 hours',
      location: 'Zoom Meeting',
      type: 'virtual',
      priority: 'high',
      attendees: [
        { name: 'Lisa Martinez', role: 'VP Sales', linkedin: 'lisamartinez', prepared: true },
        { name: 'David Kim', role: 'Account Manager', linkedin: 'davidkim', prepared: true },
      ],
      agenda: [
        { item: 'Account Review', duration: '15 min', owner: 'David Kim', status: 'prepared' },
        { item: 'Upsell Opportunities', duration: '20 min', owner: 'Lisa Martinez', status: 'prepared' },
        { item: 'Contract Renewal', duration: '15 min', owner: 'You', status: 'in-progress' },
      ],
      documents: [
        { name: 'Account History.pdf', size: '1.8 MB', uploaded: '5 hours ago' },
        { name: 'Renewal Proposal.docx', size: '0.5 MB', uploaded: '30 min ago' },
      ],
      talkingPoints: [
        'Review 2-year partnership achievements',
        'Propose premium tier upgrade',
        'Discuss custom feature requests',
      ],
      aiInsights: {
        sentiment: 'neutral',
        keyRisks: ['Budget constraints mentioned in last call'],
        opportunities: ['Interest in AI features', 'Multi-year contract discount'],
        preparation: 72,
      },
    },
  ];

  const renderMeeting = (meeting: any) => {
    const isSelected = selectedMeeting === meeting.id;

    return (
      <TouchableOpacity
        key={meeting.id}
        style={[styles.meetingCard, { backgroundColor: theme.surface }]}
        onPress={() => setSelectedMeeting(isSelected ? null : meeting.id)}
      >
        {/* Meeting Header */}
        <View style={styles.meetingHeader}>
          <View style={styles.meetingInfo}>
            <View style={styles.meetingTitleRow}>
              <Text style={[styles.meetingTitle, { color: theme.text }]}>
                {meeting.title}
              </Text>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: meeting.priority === 'critical' ? '#EF4444' : '#F59E0B' }
              ]}>
                <Text style={styles.priorityText}>
                  {meeting.priority.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.meetingMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                  {meeting.time}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name={meeting.type === 'virtual' ? 'videocam-outline' : 'location-outline'}
                  size={14}
                  color={theme.textSecondary}
                />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                  {meeting.location}
                </Text>
              </View>
            </View>
            <View style={styles.timeUntilBadge}>
              <Ionicons name="hourglass-outline" size={12} color="#FFF7F5" />
              <Text style={[styles.timeUntilText, { color: '#FFF7F5' }]}>
                {meeting.timeUntil}
              </Text>
            </View>
          </View>
        </View>

        {/* AI Preparation Score */}
        <View style={styles.preparationContainer}>
          <Text style={[styles.preparationLabel, { color: theme.textSecondary }]}>
            Preparation Score
          </Text>
          <View style={styles.preparationBar}>
            <View style={[styles.preparationBarBg, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.preparationBarFill,
                  {
                    width: `${meeting.aiInsights.preparation}%`,
                    backgroundColor: meeting.aiInsights.preparation > 70 ? '#10B981' : '#F59E0B'
                  }
                ]}
              />
            </View>
            <Text style={[styles.preparationPercent, { color: theme.text }]}>
              {meeting.aiInsights.preparation}%
            </Text>
          </View>
        </View>

        {isSelected && (
          <>
            {/* Attendees */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Attendees ({meeting.attendees.length})
              </Text>
              {meeting.attendees.map((attendee: any, index: number) => (
                <View key={index} style={styles.attendeeItem}>
                  <View style={styles.attendeeAvatar}>
                    <Text style={styles.avatarText}>
                      {attendee.name.split(' ').map((n: string) => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.attendeeInfo}>
                    <Text style={[styles.attendeeName, { color: theme.text }]}>
                      {attendee.name}
                    </Text>
                    <Text style={[styles.attendeeRole, { color: theme.textSecondary }]}>
                      {attendee.role}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.linkedinButton}>
                    <Ionicons name="logo-linkedin" size={18} color="#0077B5" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Agenda */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Agenda Items
              </Text>
              {meeting.agenda.map((item: any, index: number) => (
                <View key={index} style={styles.agendaItem}>
                  <View style={[
                    styles.agendaStatus,
                    {
                      backgroundColor:
                        item.status === 'prepared' ? '#10B981' :
                        item.status === 'in-progress' ? '#F59E0B' : theme.textSecondary
                    }
                  ]} />
                  <View style={styles.agendaContent}>
                    <Text style={[styles.agendaTitle, { color: theme.text }]}>
                      {item.item}
                    </Text>
                    <View style={styles.agendaMeta}>
                      <Text style={[styles.agendaDuration, { color: theme.textSecondary }]}>
                        {item.duration}
                      </Text>
                      <Text style={[styles.agendaOwner, { color: theme.textSecondary }]}>
                        • {item.owner}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Talking Points */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Key Talking Points
              </Text>
              {meeting.talkingPoints.map((point: string, index: number) => (
                <View key={index} style={styles.talkingPoint}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFF7F5" />
                  <Text style={[styles.talkingPointText, { color: theme.text }]}>
                    {point}
                  </Text>
                </View>
              ))}
            </View>

            {/* AI Insights */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={16} color="#FFF7F5" />
                <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 6 }]}>
                  AI Insights
                </Text>
              </View>
              <View style={styles.insightCard}>
                <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>
                  Key Opportunities
                </Text>
                {meeting.aiInsights.opportunities.map((opp: string, index: number) => (
                  <Text key={index} style={[styles.insightText, { color: '#10B981' }]}>
                    • {opp}
                  </Text>
                ))}
              </View>
              <View style={styles.insightCard}>
                <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>
                  Potential Risks
                </Text>
                {meeting.aiInsights.keyRisks.map((risk: string, index: number) => (
                  <Text key={index} style={[styles.insightText, { color: '#F59E0B' }]}>
                    • {risk}
                  </Text>
                ))}
              </View>
            </View>

            {/* Documents */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Documents ({meeting.documents.length})
              </Text>
              {meeting.documents.map((doc: any, index: number) => (
                <TouchableOpacity key={index} style={styles.documentItem}>
                  <Ionicons name="document-text-outline" size={20} color="#FFF7F5" />
                  <View style={styles.documentInfo}>
                    <Text style={[styles.documentName, { color: theme.text }]}>
                      {doc.name}
                    </Text>
                    <Text style={[styles.documentMeta, { color: theme.textSecondary }]}>
                      {doc.size} • {doc.uploaded}
                    </Text>
                  </View>
                  <Ionicons name="download-outline" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FFF7F5' }]}>
                <Ionicons name="sparkles" size={16} color="white" />
                <Text style={styles.actionButtonText}>Generate Brief</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.surface }]}>
                <Ionicons name="create-outline" size={16} color={theme.text} />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>Add Notes</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Meeting Prep</Text>
        </View>
        <TouchableOpacity style={styles.calendarButton}>
          <Ionicons name="calendar-outline" size={24} color="#FFF7F5" />
        </TouchableOpacity>
      </View>

      {/* Meetings List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF7F5" />
        }
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.listTitle, { color: theme.text }]}>
          Today's Meetings
        </Text>

        {upcomingMeetings.map(meeting => renderMeeting(meeting))}

        {/* AI Assistant Section */}
        <View style={[styles.aiAssistantCard, { backgroundColor: theme.surface }]}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={20} color="#FFF7F5" />
            <Text style={[styles.aiTitle, { color: theme.text }]}>
              {user?.assistantName || 'Yo!'} Meeting Assistant
            </Text>
          </View>
          <Text style={[styles.aiText, { color: theme.textSecondary }]}>
            I've analyzed your upcoming meetings and prepared comprehensive briefs.
            Your board meeting requires immediate attention - 2 agenda items need final review.
          </Text>
          <TouchableOpacity style={styles.aiButton}>
            <Text style={styles.aiButtonText}>Review All Preparations</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Paywall Modal */}
      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="meeting_prep"
        title="AI Meeting Preparation"
        description="Let AI prepare you for every meeting with attendee insights, agenda analysis, and smart talking points."
        benefits={[
          'AI-powered meeting briefs',
          'Attendee background research',
          'Smart agenda analysis',
          'Key talking points generation',
          'Preparation score tracking',
          'Calendar integration'
        ]}
      />
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
  calendarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  meetingCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  meetingHeader: {
    marginBottom: 12,
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  meetingMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 13,
    marginLeft: 4,
  },
  timeUntilBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  timeUntilText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  preparationContainer: {
    marginBottom: 16,
  },
  preparationLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  preparationBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preparationBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  preparationBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  preparationPercent: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    minWidth: 35,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  attendeeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 14,
    fontWeight: '500',
  },
  attendeeRole: {
    fontSize: 12,
  },
  linkedinButton: {
    padding: 8,
  },
  agendaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  agendaStatus: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  agendaContent: {
    flex: 1,
  },
  agendaTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  agendaMeta: {
    flexDirection: 'row',
  },
  agendaDuration: {
    fontSize: 12,
  },
  agendaOwner: {
    fontSize: 12,
    marginLeft: 8,
  },
  talkingPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  talkingPointText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  insightCard: {
    marginBottom: 12,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  documentMeta: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  aiAssistantCard: {
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  aiText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  aiButton: {
    backgroundColor: '#FFF7F5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  aiButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MeetingPrepScreen;
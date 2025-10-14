import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';
import { useSubscription } from '../contexts/SubscriptionContext';
import Paywall from '../components/Paywall';
import { gmailService, GmailEmail } from '../services/gmailService';

const EmailManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);
  const { hasFeature } = useSubscription();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [realEmails, setRealEmails] = useState<GmailEmail[]>([]);
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);

  useEffect(() => {
    if (!hasFeature('email_management')) {
      setShowPaywall(true);
    } else {
      checkGmailConnection();
    }
  }, [hasFeature]);

  const checkGmailConnection = async () => {
    const token = await gmailService.getAccessToken();
    setIsGmailConnected(!!token);
    if (token) {
      loadRealEmails();
    }
  };

  const connectToGmail = async () => {
    try {
      const token = await gmailService.authenticateWithGoogle();
      if (token) {
        setIsGmailConnected(true);
        await loadRealEmails();
        Alert.alert('Success', 'Gmail connected successfully!');
      } else {
        Alert.alert('Error', 'Failed to connect to Gmail. Please try again.');
      }
    } catch (error) {
      console.error('Gmail connection error:', error);
      Alert.alert('Error', 'Failed to connect to Gmail. Please check your internet connection.');
    }
  };

  const loadRealEmails = async () => {
    if (!isGmailConnected) return;

    setIsLoadingEmails(true);
    try {
      const emails = await gmailService.fetchEmails(50);
      setRealEmails(emails);
    } catch (error) {
      console.error('Error loading emails:', error);
      Alert.alert('Error', 'Failed to load emails. Please try again.');
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (isGmailConnected) {
      await loadRealEmails();
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Mock email data
  const emails = [
    {
      id: '1',
      from: 'Sarah Johnson',
      fromEmail: 'sarah.j@company.com',
      subject: 'Q3 Revenue Report - Urgent Review Required',
      preview: 'Please review the attached Q3 revenue report before tomorrow\'s board meeting. Key highlights include 23% growth in...',
      date: '10:30 AM',
      priority: 'high',
      hasAttachment: true,
      unread: true,
      aiSummary: 'Q3 report showing 23% growth, needs approval before board meeting tomorrow',
      category: 'reports',
      starred: true,
    },
    {
      id: '2',
      from: 'Michael Chen',
      fromEmail: 'mchen@techpartners.io',
      subject: 'Re: Partnership Proposal Discussion',
      preview: 'Thank you for the meeting yesterday. As discussed, I\'m attaching the revised partnership terms with the...',
      date: '9:15 AM',
      priority: 'high',
      hasAttachment: true,
      unread: true,
      aiSummary: 'Revised partnership terms attached, 3 key changes from original proposal',
      category: 'partnerships',
      starred: false,
    },
    {
      id: '3',
      from: 'Emily Davis',
      fromEmail: 'emily.davis@hr.com',
      subject: 'New Hire Onboarding - Alex Thompson',
      preview: 'Alex Thompson will be joining our team as Senior Developer next Monday. Please find the onboarding schedule...',
      date: '8:45 AM',
      priority: 'medium',
      hasAttachment: false,
      unread: false,
      aiSummary: 'New developer starting Monday, onboarding schedule included',
      category: 'hr',
      starred: false,
    },
    {
      id: '4',
      from: 'David Kim',
      fromEmail: 'dkim@investments.com',
      subject: 'Investment Opportunity: Series B Funding Round',
      preview: 'I wanted to bring to your attention an exciting investment opportunity in a promising AI startup that...',
      date: 'Yesterday',
      priority: 'medium',
      hasAttachment: true,
      unread: false,
      aiSummary: 'AI startup Series B opportunity, $50M round at $500M valuation',
      category: 'investments',
      starred: true,
    },
    {
      id: '5',
      from: 'Newsletter',
      fromEmail: 'digest@industrynews.com',
      subject: 'Weekly Industry Digest: Market Trends & Analysis',
      preview: 'This week\'s top stories: Tech stocks surge 12%, New regulations impact fintech sector, Global supply chain...',
      date: 'Yesterday',
      priority: 'low',
      hasAttachment: false,
      unread: false,
      aiSummary: 'Industry news: tech stocks up, new fintech regulations, supply chain updates',
      category: 'newsletters',
      starred: false,
    },
    {
      id: '6',
      from: 'Lisa Martinez',
      fromEmail: 'lmartinez@legal.com',
      subject: 'Contract Review Completed - Action Required',
      preview: 'The legal team has completed the review of the vendor contract. We have identified three clauses that need...',
      date: '2 days ago',
      priority: 'high',
      hasAttachment: true,
      unread: false,
      aiSummary: '3 contract clauses need revision before signing',
      category: 'legal',
      starred: false,
    },
  ];

  const folders = [
    { key: 'inbox', label: 'Inbox', count: emails.filter(e => e.unread).length, icon: 'mail' },
    { key: 'priority', label: 'Priority', count: emails.filter(e => e.priority === 'high').length, icon: 'flag' },
    { key: 'starred', label: 'Starred', count: emails.filter(e => e.starred).length, icon: 'star' },
    { key: 'drafts', label: 'Drafts', count: 3, icon: 'create' },
    { key: 'sent', label: 'Sent', count: 0, icon: 'send' },
  ];

  const filteredEmails = emails.filter(email => {
    if (selectedFolder === 'priority') return email.priority === 'high';
    if (selectedFolder === 'starred') return email.starred;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return email.from.toLowerCase().includes(query) ||
             email.subject.toLowerCase().includes(query) ||
             email.preview.toLowerCase().includes(query);
    }
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return theme.textSecondary;
    }
  };

  const handleEmailSelect = (emailId: string) => {
    if (selectedEmails.includes(emailId)) {
      setSelectedEmails(selectedEmails.filter(id => id !== emailId));
    } else {
      setSelectedEmails([...selectedEmails, emailId]);
    }
  };

  const handleBulkAction = (action: string) => {
    Alert.alert(
      `${action} Emails`,
      `${action} ${selectedEmails.length} selected emails?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          onPress: () => {
            console.log(`${action} emails:`, selectedEmails);
            setSelectedEmails([]);
          }
        }
      ]
    );
  };

  const renderEmail = (email: any, index: number) => (
    <TouchableOpacity
      key={email.id}
      style={[
        styles.emailCard,
        { backgroundColor: email.unread ? theme.surface : 'transparent' },
        selectedEmails.includes(email.id) && { backgroundColor: 'rgba(21, 183, 232, 0.1)' }
      ]}
      onPress={() => console.log('Open email:', email.id)}
      onLongPress={() => handleEmailSelect(email.id)}
    >
      <View style={styles.emailHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleEmailSelect(email.id)}
        >
          <View style={[
            styles.checkboxInner,
            { borderColor: selectedEmails.includes(email.id) ? '#FFF7F5' : theme.border },
            selectedEmails.includes(email.id) && { backgroundColor: '#FFF7F5' }
          ]}>
            {selectedEmails.includes(email.id) && (
              <Ionicons name="checkmark" size={14} color="white" />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.emailContent}>
          <View style={styles.emailTopRow}>
            <View style={styles.senderInfo}>
              <Text style={[
                styles.senderName,
                { color: theme.text },
                email.unread && styles.unreadText
              ]}>
                {email.from}
              </Text>
              {email.starred && (
                <Ionicons name="star" size={14} color="#F59E0B" style={{ marginLeft: 6 }} />
              )}
            </View>
            <Text style={[styles.emailDate, { color: theme.textSecondary }]}>
              {email.date}
            </Text>
          </View>

          <Text style={[
            styles.emailSubject,
            { color: theme.text },
            email.unread && styles.unreadText
          ]} numberOfLines={1}>
            {email.subject}
          </Text>

          <Text style={[styles.emailPreview, { color: theme.textSecondary }]} numberOfLines={2}>
            {email.preview}
          </Text>

          {email.aiSummary && (
            <View style={styles.aiSummaryContainer}>
              <Ionicons name="sparkles" size={12} color="#FFF7F5" />
              <Text style={[styles.aiSummary, { color: '#FFF7F5' }]} numberOfLines={1}>
                AI: {email.aiSummary}
              </Text>
            </View>
          )}

          <View style={styles.emailMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(email.priority) }]}>
              <Text style={styles.priorityText}>
                {email.priority.charAt(0).toUpperCase() + email.priority.slice(1)}
              </Text>
            </View>
            {email.hasAttachment && (
              <View style={styles.attachmentBadge}>
                <Ionicons name="attach" size={14} color={theme.textSecondary} />
              </View>
            )}
            <View style={[styles.categoryBadge, { backgroundColor: theme.surface }]}>
              <Text style={[styles.categoryText, { color: theme.textSecondary }]}>
                {email.category}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {filteredEmails.length > 1 && index < filteredEmails.length - 1 && (
        <View style={[styles.emailDivider, { backgroundColor: theme.border }]} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Email</Text>
          {filteredEmails.filter(e => e.unread).length > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {filteredEmails.filter(e => e.unread).length}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.composeButton}>
          <Ionicons name="create-outline" size={24} color="#FFF7F5" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search emails..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Gmail Connection Status */}
      {!isGmailConnected && (
        <View style={[styles.connectionAlert, { backgroundColor: '#FFF3CD', borderColor: '#FFEAA7' }]}>
          <View style={styles.connectionAlertContent}>
            <Ionicons name="mail-outline" size={20} color="#856404" />
            <Text style={[styles.connectionAlertText, { color: '#856404' }]}>
              Connect your Gmail account to see real emails
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: '#FFF7F5' }]}
            onPress={connectToGmail}
          >
            <Text style={styles.connectButtonText}>Connect Gmail</Text>
          </TouchableOpacity>
        </View>
      )}

      {isGmailConnected && (
        <View style={[styles.connectionAlert, { backgroundColor: '#D4F6D4', borderColor: '#10B981' }]}>
          <View style={styles.connectionAlertContent}>
            <Ionicons name="checkmark-circle" size={20} color="#065F46" />
            <Text style={[styles.connectionAlertText, { color: '#065F46' }]}>
              Gmail connected - Showing {realEmails.length} emails
            </Text>
          </View>
          {isLoadingEmails && (
            <Text style={[styles.loadingText, { color: '#065F46' }]}>Loading...</Text>
          )}
        </View>
      )}

      {/* Folders */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.foldersContainer}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {folders.map(folder => (
          <TouchableOpacity
            key={folder.key}
            style={[
              styles.folderTab,
              { backgroundColor: theme.surface },
              selectedFolder === folder.key && { backgroundColor: '#FFF7F5' }
            ]}
            onPress={() => setSelectedFolder(folder.key)}
          >
            <Ionicons
              name={folder.icon as any}
              size={16}
              color={selectedFolder === folder.key ? 'white' : theme.text}
            />
            <Text style={[
              styles.folderText,
              { color: selectedFolder === folder.key ? 'white' : theme.text }
            ]}>
              {folder.label}
            </Text>
            {folder.count > 0 && (
              <View style={[
                styles.folderBadge,
                { backgroundColor: selectedFolder === folder.key ? 'rgba(255, 247, 245,0.3)' : '#FFF7F5' }
              ]}>
                <Text style={styles.folderBadgeText}>{folder.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bulk Actions */}
      {selectedEmails.length > 0 && (
        <View style={[styles.bulkActions, { backgroundColor: theme.surface }]}>
          <Text style={[styles.selectedCount, { color: theme.text }]}>
            {selectedEmails.length} selected
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleBulkAction('Archive')}
            >
              <Ionicons name="archive-outline" size={20} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleBulkAction('Delete')}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleBulkAction('Mark as Read')}
            >
              <Ionicons name="mail-open-outline" size={20} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setSelectedEmails([])}
            >
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Email List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF7F5" />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {filteredEmails.map((email, index) => renderEmail(email, index))}
      </ScrollView>

      {/* AI Assistant Floating Button */}
      <TouchableOpacity style={styles.aiFloatingButton}>
        <Ionicons name="sparkles" size={24} color="white" />
      </TouchableOpacity>

      {/* Paywall Modal */}
      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="email_management"
        title="Smart Email Management"
        description="Unlock AI-powered email processing, smart summaries, bulk actions, and priority filtering to manage your inbox like a pro."
        benefits={[
          'AI email summaries and insights',
          'Smart inbox prioritization',
          'Bulk action processing',
          'Advanced filtering options',
          'Email analytics and patterns',
          'Integration with calendar and tasks'
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  composeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  foldersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    maxHeight: 50,
  },
  folderTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  folderText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  folderBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 6,
  },
  folderBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 16,
  },
  emailCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailContent: {
    flex: 1,
  },
  emailTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 15,
    fontWeight: '500',
  },
  unreadText: {
    fontWeight: '700',
  },
  emailDate: {
    fontSize: 12,
  },
  emailSubject: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  emailPreview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  aiSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiSummary: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    flex: 1,
  },
  emailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  attachmentBadge: {
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreButton: {
    padding: 4,
  },
  emailDivider: {
    height: 0.5,
    marginLeft: 52,
    marginRight: 20,
    marginTop: 12,
  },
  aiFloatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF7F5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  connectionAlert: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectionAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  connectionAlertText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  connectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default EmailManagementScreen;
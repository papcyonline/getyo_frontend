import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { EmailThread, Email } from '../types/email';
import emailService from '../services/emailService';
import smartReplyService, { SmartReply } from '../services/smartReplyService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type EmailDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EmailDetail'>;
type EmailDetailScreenRouteProp = RouteProp<RootStackParamList, 'EmailDetail'>;

const EmailDetailScreen: React.FC = () => {
  const navigation = useNavigation<EmailDetailScreenNavigationProp>();
  const route = useRoute<EmailDetailScreenRouteProp>();
  const { threadId, accountId } = route.params;

  const [thread, setThread] = useState<EmailThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [smartReplies, setSmartReplies] = useState<SmartReply[]>([]);

  useEffect(() => {
    loadThread();
  }, [threadId, accountId]);

  const loadThread = async () => {
    try {
      const threadData = await emailService.getThread(accountId, threadId);
      setThread(threadData);

      // Generate smart replies for the most recent message
      if (threadData.messages && threadData.messages.length > 0) {
        const latestMessage = threadData.messages[0];
        const suggestions = smartReplyService.generateSmartReplies(latestMessage);
        setSmartReplies(suggestions);

        // Mark as read
        if (!threadData.isRead) {
          await emailService.markAsRead(accountId, latestMessage.id, true);
        }
      }
    } catch (error: any) {
      console.error('Failed to load thread:', error);
      Alert.alert('Error', 'Failed to load email thread');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadThread();
  };

  const handleReply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (thread && thread.messages && thread.messages.length > 0) {
      navigation.navigate('EmailCompose', {
        accountId,
        replyTo: thread.messages[0].id,
      });
    }
  };

  const handleSmartReply = (reply: SmartReply) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (thread && thread.messages && thread.messages.length > 0) {
      const latestMessage = thread.messages[0];
      const fullReply = smartReplyService.expandReplyToFullEmail(reply, latestMessage);

      // Navigate to compose with pre-filled content
      navigation.navigate('EmailCompose', {
        accountId,
        replyTo: latestMessage.id,
        initialBody: fullReply,
      });
    }
  };

  const handleReplyAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Similar to reply but includes all recipients
    if (thread && thread.messages && thread.messages.length > 0) {
      navigation.navigate('EmailCompose', {
        accountId,
        replyTo: thread.messages[0].id,
      });
    }
  };

  const handleForward = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (thread && thread.messages && thread.messages.length > 0) {
      navigation.navigate('EmailCompose', {
        accountId,
        forward: thread.messages[0].id,
      });
    }
  };

  const handleToggleStar = async () => {
    if (!thread) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await emailService.toggleStar(accountId, threadId, !thread.isStarred);
      setThread({ ...thread, isStarred: !thread.isStarred });
    } catch (error: any) {
      console.error('Failed to toggle star:', error);
    }
  };

  const handleArchive = async () => {
    if (!thread || !thread.messages || thread.messages.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await emailService.moveToFolder(accountId, thread.messages[0].id, 'archive');
      Alert.alert('Success', 'Email archived');
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to archive email:', error);
      Alert.alert('Error', 'Failed to archive email');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Email',
      'Are you sure you want to delete this email?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!thread || !thread.messages || thread.messages.length === 0) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            try {
              await emailService.deleteEmail(accountId, thread.messages[0].id);
              navigation.goBack();
            } catch (error: any) {
              console.error('Failed to delete email:', error);
              Alert.alert('Error', 'Failed to delete email');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = (message: Email) => {
    return (
      <View key={message.id} style={styles.messageCard}>
        <View style={styles.messageHeader}>
          <View style={styles.senderInfo}>
            <View style={styles.senderAvatar}>
              <Text style={styles.senderInitial}>
                {message.from.name ? message.from.name.charAt(0).toUpperCase() : message.from.email.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.senderDetails}>
              <Text style={styles.senderName}>
                {message.from.name || message.from.email}
              </Text>
              <Text style={styles.senderEmail}>{message.from.email}</Text>
            </View>
          </View>
          <Text style={styles.messageDate}>{formatDate(message.date)}</Text>
        </View>

        {message.to.length > 0 && (
          <View style={styles.recipientsRow}>
            <Text style={styles.recipientsLabel}>To: </Text>
            <Text style={styles.recipientsText}>
              {message.to.map(r => r.name || r.email).join(', ')}
            </Text>
          </View>
        )}

        {message.cc && message.cc.length > 0 && (
          <View style={styles.recipientsRow}>
            <Text style={styles.recipientsLabel}>Cc: </Text>
            <Text style={styles.recipientsText}>
              {message.cc.map(r => r.name || r.email).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.messageBodyContainer}>
          <Text style={styles.messageBody}>{message.body}</Text>
        </View>

        {message.attachments && message.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            <Text style={styles.attachmentsTitle}>Attachments ({message.attachments.length})</Text>
            {message.attachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachmentItem}>
                <Ionicons name="document-outline" size={20} color="#C9A96E" />
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentName}>{attachment.filename}</Text>
                  <Text style={styles.attachmentSize}>
                    {(attachment.size / 1024).toFixed(1)} KB
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Email</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#C9A96E" />
        </View>
      </LinearGradient>
    );
  }

  if (!thread) {
    return (
      <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Email</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Email not found</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleStar} style={styles.headerButton}>
            <Ionicons
              name={thread.isStarred ? 'star' : 'star-outline'}
              size={22}
              color={thread.isStarred ? '#FFD700' : '#FFFFFF'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleArchive} style={styles.headerButton}>
            <Ionicons name="archive-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.subjectContainer}>
          <Text style={styles.subjectText}>{thread.subject}</Text>
          {thread.hasAttachments && (
            <Ionicons name="attach" size={20} color="#C9A96E" style={styles.attachmentIcon} />
          )}
        </View>

        {thread.messages && thread.messages.length > 0 ? (
          thread.messages.map((message) => renderMessage(message))
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No messages in this thread</Text>
          </View>
        )}
      </ScrollView>

      {smartReplies.length > 0 && (
        <View style={styles.smartRepliesContainer}>
          <Text style={styles.smartRepliesTitle}>Quick Replies</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.smartRepliesScroll}
          >
            {smartReplies.map((reply) => (
              <TouchableOpacity
                key={reply.id}
                style={styles.smartReplyChip}
                onPress={() => handleSmartReply(reply)}
                activeOpacity={0.7}
              >
                <Text style={styles.smartReplyText}>{reply.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.actionBar}>
        <TouchableOpacity onPress={handleReply} style={styles.actionButton}>
          <LinearGradient
            colors={['#C9A96E', '#E5C794']}
            style={styles.actionButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="arrow-undo-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Reply</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleReplyAll} style={styles.actionButton}>
          <View style={styles.actionButtonOutline}>
            <Ionicons name="people-outline" size={20} color="#C9A96E" />
            <Text style={styles.actionButtonTextOutline}>Reply All</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleForward} style={styles.actionButton}>
          <View style={styles.actionButtonOutline}>
            <Ionicons name="arrow-redo-outline" size={20} color="#C9A96E" />
            <Text style={styles.actionButtonTextOutline}>Forward</Text>
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
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
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  subjectText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  attachmentIcon: {
    marginLeft: 8,
  },
  messageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  senderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C9A96E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  senderInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  senderDetails: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  senderEmail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  messageDate: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  recipientsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recipientsLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  recipientsText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  messageBodyContainer: {
    marginTop: 12,
  },
  messageBody: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  attachmentsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  attachmentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  attachmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flex: 1,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#667EEA',
    gap: 8,
  },
  actionButtonTextOutline: {
    fontSize: 15,
    fontWeight: '600',
    color: '#667EEA',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  smartRepliesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  smartRepliesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smartRepliesScroll: {
    gap: 10,
  },
  smartReplyChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    borderWidth: 1,
    borderColor: '#C9A96E',
  },
  smartReplyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5C794',
  },
});

export default EmailDetailScreen;

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Email, EmailThread, EmailFolder, EmailAccount } from '../types/email';
import { RootStackParamList } from '../types';
import emailService from '../services/emailService';

type EmailListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EmailList'>;

const EmailListScreen: React.FC = () => {
  const navigation = useNavigation<EmailListScreenNavigationProp>();

  const [emails, setEmails] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder>('inbox');
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const folders: { id: EmailFolder; label: string; icon: string }[] = [
    { id: 'inbox', label: 'Inbox', icon: 'mail' },
    { id: 'sent', label: 'Sent', icon: 'send' },
    { id: 'drafts', label: 'Drafts', icon: 'document-text' },
    { id: 'archive', label: 'Archive', icon: 'archive' },
    { id: 'trash', label: 'Trash', icon: 'trash' },
  ];

  // Load email accounts
  useEffect(() => {
    loadAccounts();
  }, []);

  // Load emails when account or folder changes
  useFocusEffect(
    useCallback(() => {
      if (selectedAccount) {
        loadEmails();
      }
    }, [selectedAccount, selectedFolder, filter])
  );

  const loadAccounts = async () => {
    try {
      const accountsList = await emailService.getAccounts();
      setAccounts(accountsList);

      if (accountsList.length > 0) {
        setSelectedAccount(accountsList.find(a => a.isDefault) || accountsList[0]);
      }
    } catch (error: any) {
      console.error('Failed to load email accounts:', error);
    }
  };

  const loadEmails = async (pageNum: number = 1, append: boolean = false) => {
    if (!selectedAccount) return;

    try {
      if (!append) {
        setLoading(true);
      }

      const filterConfig = {
        folder: selectedFolder,
        isRead: filter === 'unread' ? false : undefined,
        isStarred: filter === 'starred' ? true : undefined,
      };

      const result = await emailService.getThreads(selectedAccount.id, filterConfig, pageNum);

      if (append) {
        setEmails(prev => [...prev, ...result.threads]);
      } else {
        setEmails(result.threads);
      }

      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Failed to load emails:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEmails(1, false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadEmails(page + 1, true);
    }
  };

  const handleSearch = async () => {
    if (!selectedAccount || !searchQuery.trim()) return;

    try {
      setLoading(true);
      const result = await emailService.searchEmails(selectedAccount.id, searchQuery, 1);
      setEmails(result.emails.map(email => ({
        id: email.threadId,
        subject: email.subject,
        participants: [email.from, ...email.to],
        preview: email.preview,
        date: email.date,
        messageCount: 1,
        isRead: email.isRead,
        isStarred: email.isStarred,
        hasAttachments: email.hasAttachments,
        folder: email.folder,
      })));
    } catch (error: any) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPress = (thread: EmailThread) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('EmailDetail', {
      threadId: thread.id,
      accountId: selectedAccount?.id || '',
    });
  };

  const handleToggleStar = async (thread: EmailThread) => {
    if (!selectedAccount) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await emailService.toggleStar(selectedAccount.id, thread.id, !thread.isStarred);
      setEmails(prev => prev.map(e =>
        e.id === thread.id ? { ...e, isStarred: !e.isStarred } : e
      ));
    } catch (error: any) {
      console.error('Failed to toggle star:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderEmailItem = ({ item }: { item: EmailThread }) => (
    <TouchableOpacity
      style={[styles.emailItem, !item.isRead && styles.emailItemUnread]}
      onPress={() => handleEmailPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.emailHeader}>
        <View style={styles.emailSender}>
          <Text style={[styles.senderName, !item.isRead && styles.unreadText]} numberOfLines={1}>
            {item.participants[0]?.name || item.participants[0]?.email || 'Unknown'}
          </Text>
          {item.messageCount > 1 && (
            <View style={styles.threadCount}>
              <Text style={styles.threadCountText}>{item.messageCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.emailDate}>{formatDate(item.date)}</Text>
      </View>

      <View style={styles.emailSubject}>
        <Text style={[styles.subjectText, !item.isRead && styles.unreadText]} numberOfLines={1}>
          {item.subject || '(No Subject)'}
        </Text>
        {item.hasAttachments && (
          <Ionicons name="attach" size={14} color="#999" style={styles.attachIcon} />
        )}
      </View>

      <Text style={styles.emailPreview} numberOfLines={2}>
        {item.preview}
      </Text>

      <View style={styles.emailFooter}>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleToggleStar(item);
          }}
          style={styles.starButton}
        >
          <Ionicons
            name={item.isStarred ? 'star' : 'star-outline'}
            size={18}
            color={item.isStarred ? '#C9A96E' : '#666'}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="mail-open-outline" size={64} color="#666" />
      <Text style={styles.emptyText}>No emails in {selectedFolder}</Text>
      {accounts.length === 0 && (
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => navigation.navigate('EmailAccounts')}
        >
          <LinearGradient
            colors={['#C9A96E', '#E5C794']}
            style={styles.connectButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.connectButtonText}>Connect Email Account</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1A1A1A', '#0A0A0A']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Email</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('EmailCompose', { accountId: selectedAccount?.id })}
            style={styles.composeButton}
          >
            <Ionicons name="create-outline" size={24} color="#C9A96E" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search emails..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Folder Tabs */}
        <FlatList
          horizontal
          data={folders}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.folderTabs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.folderTab,
                selectedFolder === item.id && styles.folderTabActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedFolder(item.id);
              }}
            >
              <Ionicons
                name={item.icon as any}
                size={18}
                color={selectedFolder === item.id ? '#C9A96E' : '#666'}
              />
              <Text
                style={[
                  styles.folderTabText,
                  selectedFolder === item.id && styles.folderTabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          {['all', 'unread', 'starred'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                filter === f && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f as any)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === f && styles.filterChipTextActive,
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Email List */}
      {loading && emails.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C9A96E" />
          <Text style={styles.loadingText}>Loading emails...</Text>
        </View>
      ) : (
        <FlatList
          data={emails}
          keyExtractor={(item) => item.id}
          renderItem={renderEmailItem}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#C9A96E"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 169, 110, 0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  composeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  folderTabs: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  folderTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  folderTabActive: {
    backgroundColor: 'rgba(201, 169, 110, 0.2)',
  },
  folderTabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  folderTabTextActive: {
    color: '#C9A96E',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#C9A96E',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#000',
  },
  listContent: {
    paddingVertical: 8,
  },
  emailItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  emailItemUnread: {
    backgroundColor: 'rgba(201, 169, 110, 0.05)',
    borderLeftColor: '#C9A96E',
  },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emailSender: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCC',
    flex: 1,
  },
  unreadText: {
    color: '#FFF',
    fontWeight: '700',
  },
  threadCount: {
    backgroundColor: 'rgba(201, 169, 110, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  threadCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C9A96E',
  },
  emailDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  emailSubject: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCC',
    flex: 1,
  },
  attachIcon: {
    marginLeft: 8,
  },
  emailPreview: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  emailFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  starButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  connectButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  connectButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});

export default EmailListScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';

const SmartSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const performSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 1000);
  };

  // Mock search results
  const searchResults = searchQuery ? [
    {
      id: '1',
      type: 'email',
      title: 'Q3 Revenue Report Discussion',
      content: 'Sarah mentioned the 23% growth figure in her email about the board meeting preparation...',
      source: 'sarah.j@company.com',
      date: '2 hours ago',
      relevance: 95,
    },
    {
      id: '2',
      type: 'meeting',
      title: 'Board Meeting - Q3 Review',
      content: 'Discussed quarterly performance, budget allocations, and strategic initiatives for Q4...',
      source: 'Meeting Notes',
      date: 'Today 10:00 AM',
      relevance: 92,
    },
    {
      id: '3',
      type: 'task',
      title: 'Review Investment Portfolio',
      content: 'Monthly portfolio assessment including risk analysis and rebalancing recommendations...',
      source: 'Tasks',
      date: 'Due tomorrow',
      relevance: 87,
    },
    {
      id: '4',
      type: 'note',
      title: 'Client Feedback - TechCorp',
      content: 'Positive response to new features. Interest in enterprise upgrade and custom reporting...',
      source: 'Quick Notes',
      date: 'Yesterday',
      relevance: 84,
    },
    {
      id: '5',
      type: 'document',
      title: 'Market Analysis Report.pdf',
      content: 'Comprehensive analysis of market trends, competitive landscape, and growth opportunities...',
      source: 'Documents',
      date: '3 days ago',
      relevance: 82,
    },
  ] : [];

  const recentSearches = [
    'What did John say about the merger?',
    'Budget approval meetings',
    'Investment opportunities Q4',
    'Sarah project updates',
    'Client feedback reports',
  ];

  const quickFilters = [
    { key: 'all', label: 'All', icon: 'search' },
    { key: 'emails', label: 'Emails', icon: 'mail' },
    { key: 'meetings', label: 'Meetings', icon: 'people' },
    { key: 'tasks', label: 'Tasks', icon: 'list' },
    { key: 'notes', label: 'Notes', icon: 'document-text' },
    { key: 'documents', label: 'Files', icon: 'folder' },
  ];

  const smartSuggestions = [
    'Show me all emails from Sarah this week',
    'Find meetings about budget planning',
    'Tasks related to client feedback',
    'Documents modified in the last 7 days',
    'Notes containing "investment opportunity"',
  ];

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'email': return 'mail';
      case 'meeting': return 'people';
      case 'task': return 'checkbox';
      case 'note': return 'document-text';
      case 'document': return 'document';
      default: return 'search';
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'email': return '#10B981';
      case 'meeting': return '#8B5CF6';
      case 'task': return '#FFF7F5';
      case 'note': return '#F59E0B';
      case 'document': return '#EF4444';
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Smart Search</Text>
        </View>
        <TouchableOpacity style={styles.voiceButton}>
          <Ionicons name="mic-outline" size={24} color="#FFF7F5" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search across emails, meetings, tasks, notes..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => performSearch(searchQuery)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {quickFilters.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              { backgroundColor: theme.surface },
              selectedFilter === filter.key && { backgroundColor: '#FFF7F5' }
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={selectedFilter === filter.key ? 'white' : theme.text}
            />
            <Text style={[
              styles.filterText,
              { color: selectedFilter === filter.key ? 'white' : theme.text }
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {searchQuery.length === 0 ? (
          <>
            {/* Recent Searches */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Recent Searches
              </Text>
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentSearchItem}
                  onPress={() => performSearch(search)}
                >
                  <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.recentSearchText, { color: theme.text }]}>
                    {search}
                  </Text>
                  <Ionicons name="arrow-up-outline" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Smart Suggestions */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={16} color="#FFF7F5" />
                <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>
                  {user?.assistantName || 'Yo!'} Suggestions
                </Text>
              </View>
              {smartSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionItem, { backgroundColor: theme.surface }]}
                  onPress={() => performSearch(suggestion)}
                >
                  <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
                  <Text style={[styles.suggestionText, { color: theme.text }]}>
                    {suggestion}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF7F5" />
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Search Results */}
            <View style={styles.section}>
              <View style={styles.resultsHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Results for "{searchQuery}"
                </Text>
                <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
                  {searchResults.length} items found
                </Text>
              </View>

              {isSearching ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                    Searching across all your data...
                  </Text>
                </View>
              ) : (
                <>
                  {searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={result.id}
                      style={[styles.resultCard, { backgroundColor: theme.surface }]}
                    >
                      <View style={styles.resultHeader}>
                        <View style={styles.resultTypeIcon}>
                          <Ionicons
                            name={getResultIcon(result.type) as any}
                            size={20}
                            color={getResultColor(result.type)}
                          />
                        </View>
                        <View style={styles.resultContent}>
                          <View style={styles.resultTitleRow}>
                            <Text style={[styles.resultTitle, { color: theme.text }]} numberOfLines={1}>
                              {result.title}
                            </Text>
                            <View style={styles.relevanceScore}>
                              <Text style={[styles.relevanceText, { color: '#FFF7F5' }]}>
                                {result.relevance}%
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={[styles.resultDescription, { color: theme.textSecondary }]}
                            numberOfLines={2}
                          >
                            {result.content}
                          </Text>
                          <View style={styles.resultMeta}>
                            <Text style={[styles.resultSource, { color: theme.textSecondary }]}>
                              {result.source}
                            </Text>
                            <Text style={[styles.resultDate, { color: theme.textSecondary }]}>
                              • {result.date}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {searchResults.length > 1 && index < searchResults.length - 1 && (
                        <View style={[styles.resultDivider, { backgroundColor: theme.border }]} />
                      )}
                    </TouchableOpacity>
                  ))}

                  {/* AI Context */}
                  <View style={[styles.aiContextCard, { backgroundColor: theme.surface }]}>
                    <View style={styles.aiContextHeader}>
                      <Ionicons name="sparkles" size={16} color="#FFF7F5" />
                      <Text style={[styles.aiContextTitle, { color: theme.text }]}>
                        Context Summary
                      </Text>
                    </View>
                    <Text style={[styles.aiContextText, { color: theme.textSecondary }]}>
                      Based on your search, it looks like you're preparing for the Q3 board meeting.
                      I found relevant emails from Sarah, meeting notes, and the financial report.
                      Would you like me to create a comprehensive brief?
                    </Text>
                    <TouchableOpacity style={styles.aiContextButton}>
                      <Text style={styles.aiContextButtonText}>Create Brief</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
  voiceButton: {
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
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    maxHeight: 50,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
  },
  resultTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(21, 183, 232, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  relevanceScore: {
    backgroundColor: 'rgba(21, 183, 232, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  relevanceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  resultDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
  },
  resultSource: {
    fontSize: 12,
    fontWeight: '500',
  },
  resultDate: {
    fontSize: 12,
    marginLeft: 4,
  },
  resultDivider: {
    height: 0.5,
    marginTop: 12,
    marginLeft: 52,
  },
  aiContextCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  aiContextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiContextTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  aiContextText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  aiContextButton: {
    backgroundColor: '#FFF7F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  aiContextButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SmartSearchScreen;
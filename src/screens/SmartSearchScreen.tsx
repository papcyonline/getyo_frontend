import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';
import api from '../services/api';

const THEME_GOLD = '#C9A96E';

const SmartSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data when component mounts
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [recent, suggestions] = await Promise.all([
        api.getRecentSearches(),
        api.getSuggestions(),
      ]);
      setRecentSearches(recent);
      setSmartSuggestions(suggestions);
    } catch (error: any) {
      console.error('Failed to load initial data:', error);
      // Don't show alert for initial data load failures
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    if (!query || query.trim().length === 0) {
      return;
    }

    setSearchQuery(query);
    setIsSearching(true);

    try {
      // Perform search
      const searchData = await api.search(query.trim(), selectedFilter);
      setSearchResults(searchData.results);

      // Generate AI summary if there are results
      if (searchData.results.length > 0) {
        const summaryData = await api.getAiSummary(query.trim(), searchData.results);
        setAiSummary(summaryData.summary);
      } else {
        setAiSummary('');
      }

      // Refresh recent searches
      const recent = await api.getRecentSearches();
      setRecentSearches(recent);
    } catch (error: any) {
      console.error('Search failed:', error);
      Alert.alert('Search Error', error.message || 'Failed to perform search. Please try again.');
      setSearchResults([]);
      setAiSummary('');
    } finally {
      setIsSearching(false);
    }
  };

  const quickFilters = [
    { key: 'all', label: 'All', icon: 'search' },
    { key: 'emails', label: 'Emails', icon: 'mail' },
    { key: 'meetings', label: 'Meetings', icon: 'people' },
    { key: 'tasks', label: 'Tasks', icon: 'list' },
    { key: 'notes', label: 'Notes', icon: 'document-text' },
    { key: 'documents', label: 'Files', icon: 'folder' },
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
      case 'task': return THEME_GOLD;
      case 'note': return '#F59E0B';
      case 'document': return '#EF4444';
      default: return theme.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Research</Text>
        <TouchableOpacity style={styles.voiceButton}>
          <Ionicons name="mic-outline" size={24} color={THEME_GOLD} />
        </TouchableOpacity>
      </View>

      {/* Main Content with Gray Background */}
      <View style={styles.bottomSheet}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: '#1A1A1A' }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Ask AI anything or search your data..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => performSearch(searchQuery)}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setShowFilterModal(true)}>
                <Ionicons name="options-outline" size={20} color={THEME_GOLD} />
              </TouchableOpacity>
            )}
          </View>

          {/* Selected Filter Display */}
          {selectedFilter !== 'all' && (
            <View style={styles.selectedFilterContainer}>
              <View style={styles.selectedFilterChip}>
                <Ionicons
                  name={quickFilters.find(f => f.key === selectedFilter)?.icon as any}
                  size={14}
                  color={THEME_GOLD}
                />
                <Text style={[styles.selectedFilterText, { color: THEME_GOLD }]}>
                  {quickFilters.find(f => f.key === selectedFilter)?.label}
                </Text>
                <TouchableOpacity onPress={() => setSelectedFilter('all')}>
                  <Ionicons name="close" size={14} color={THEME_GOLD} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Content Area - Scrollable */}
        <ScrollView
          style={styles.contentArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME_GOLD} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading...
              </Text>
            </View>
          ) : searchQuery.length === 0 ? (
            <>
              {/* AI Suggestions */}
              {smartSuggestions.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="sparkles" size={18} color={THEME_GOLD} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {user?.assistantName || 'Yo!'} Suggestions
                    </Text>
                  </View>
                  {smartSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.suggestionCard, { backgroundColor: '#1A1A1A' }]}
                      onPress={() => performSearch(suggestion)}
                    >
                      <Ionicons name="bulb-outline" size={20} color={THEME_GOLD} />
                      <Text style={[styles.suggestionText, { color: theme.text }]}>
                        {suggestion}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
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
                      <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
                      <Text style={[styles.recentSearchText, { color: theme.text }]}>
                        {search}
                      </Text>
                      <Ionicons name="arrow-up-outline" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              {/* Search Results Header */}
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsTitle, { color: theme.text }]}>
                  {searchResults.length} Results
                </Text>
                <View style={styles.resultsSortButton}>
                  <Ionicons name="funnel-outline" size={14} color={THEME_GOLD} />
                  <Text style={[styles.resultsSortText, { color: THEME_GOLD }]}>Relevance</Text>
                </View>
              </View>

              {isSearching ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={THEME_GOLD} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                    Searching with AI...
                  </Text>
                </View>
              ) : searchResults.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={64} color={theme.textTertiary} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    No Results Found
                  </Text>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    Try using different keywords or adjust your filters
                  </Text>
                </View>
              ) : (
                <>
                  {/* AI Context Card */}
                  {aiSummary && (
                    <View style={[styles.aiContextCard, { backgroundColor: '#1A1A1A' }]}>
                      <View style={styles.aiContextHeader}>
                        <View style={styles.aiIcon}>
                          <Ionicons name="sparkles" size={16} color={THEME_GOLD} />
                        </View>
                        <Text style={[styles.aiContextTitle, { color: theme.text }]}>
                          AI Summary
                        </Text>
                      </View>
                      <Text style={[styles.aiContextText, { color: theme.textSecondary }]}>
                        {aiSummary}
                      </Text>
                      <View style={styles.aiActionsRow}>
                        <TouchableOpacity style={[styles.aiActionButton, { backgroundColor: `${THEME_GOLD}20` }]}>
                          <Text style={[styles.aiActionText, { color: THEME_GOLD }]}>Create Brief</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.aiActionButton, { backgroundColor: `${THEME_GOLD}20` }]}>
                          <Text style={[styles.aiActionText, { color: THEME_GOLD }]}>Summary</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Results */}
                  <View style={styles.resultsSection}>
                    {searchResults.map((result) => (
                      <TouchableOpacity
                        key={result.id}
                        style={[styles.resultCard, { backgroundColor: '#1A1A1A' }]}
                      >
                        <View style={styles.resultHeader}>
                          <View style={[styles.resultTypeIcon, { backgroundColor: `${getResultColor(result.type)}20` }]}>
                            <Ionicons
                              name={getResultIcon(result.type) as any}
                              size={18}
                              color={getResultColor(result.type)}
                            />
                          </View>
                          <View style={styles.resultContent}>
                            <View style={styles.resultTitleRow}>
                              <Text style={[styles.resultTitle, { color: theme.text }]} numberOfLines={1}>
                                {result.title}
                              </Text>
                              <View style={[styles.relevanceScore, { backgroundColor: `${THEME_GOLD}20` }]}>
                                <Text style={[styles.relevanceText, { color: THEME_GOLD }]}>
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
                              <Text style={[styles.resultMetaText, { color: theme.textTertiary }]}>
                                {result.source} • {result.date}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>

      {/* Filter Modal */}
      {showFilterModal && (
        <Modal visible={showFilterModal} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackground}
              onPress={() => setShowFilterModal(false)}
            />
            <View style={[styles.filterModal, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.filterModalHeader}>
                <View style={styles.filterModalHandle} />
                <Text style={[styles.filterModalTitle, { color: theme.text }]}>Filter Results</Text>
              </View>
              <View style={styles.filterModalContent}>
                {quickFilters.map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[
                      styles.filterModalOption,
                      selectedFilter === filter.key && { backgroundColor: `${THEME_GOLD}20` }
                    ]}
                    onPress={() => {
                      setSelectedFilter(filter.key);
                      setShowFilterModal(false);
                    }}
                  >
                    <View style={[styles.filterModalIcon, selectedFilter === filter.key && { backgroundColor: `${THEME_GOLD}30` }]}>
                      <Ionicons
                        name={filter.icon as any}
                        size={20}
                        color={selectedFilter === filter.key ? THEME_GOLD : theme.text}
                      />
                    </View>
                    <Text style={[styles.filterModalText, { color: selectedFilter === filter.key ? THEME_GOLD : theme.text }]}>
                      {filter.label}
                    </Text>
                    {selectedFilter === filter.key && (
                      <Ionicons name="checkmark-circle" size={20} color={THEME_GOLD} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  voiceButton: {
    padding: 8,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  searchSection: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  selectedFilterContainer: {
    marginTop: 12,
  },
  selectedFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${THEME_GOLD}20`,
    borderRadius: 16,
    gap: 6,
  },
  selectedFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 14,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  resultsSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: `${THEME_GOLD}20`,
    borderRadius: 12,
  },
  resultsSortText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  aiContextCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  aiContextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${THEME_GOLD}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiContextTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  aiContextText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  aiActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  aiActionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  aiActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultsSection: {
    gap: 10,
  },
  resultCard: {
    padding: 14,
    borderRadius: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  resultTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  relevanceScore: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  relevanceText: {
    fontSize: 10,
    fontWeight: '700',
  },
  resultDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
  },
  resultMetaText: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  filterModal: {
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  filterModalHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterModalHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 12,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterModalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  filterModalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${THEME_GOLD}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SmartSearchScreen;

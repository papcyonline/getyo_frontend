import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';

const QuickCaptureScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);

  const [selectedTab, setSelectedTab] = useState('capture');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [isRecording, setIsRecording] = useState(false);
  const contentInputRef = useRef<TextInput>(null);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSaveNote = () => {
    if (!noteTitle.trim() && !noteContent.trim()) {
      Alert.alert('Empty Note', 'Please add some content before saving.');
      return;
    }

    Alert.alert('Note Saved', `Your note "${noteTitle || 'Untitled'}" has been saved successfully.`);
    setNoteTitle('');
    setNoteContent('');
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      Alert.alert('Recording Started', 'Speak clearly. Tap again to stop and transcribe.');
    } else {
      Alert.alert('Processing', 'Transcribing your voice note...');
      setTimeout(() => {
        setNoteContent(noteContent + '\n\n[Transcribed]: Review quarterly projections and adjust budget allocations for Q4.');
      }, 1500);
    }
  };

  // Mock notes data
  const recentNotes = [
    {
      id: '1',
      title: 'Board Meeting Action Items',
      content: 'Follow up on supply chain discussion. Schedule meeting with logistics team.',
      category: 'meetings',
      timestamp: '2 hours ago',
      hasAudio: false,
    },
    {
      id: '2',
      title: 'Product Feature Ideas',
      content: 'AI-powered dashboard analytics. Real-time collaboration features. Mobile app offline mode.',
      category: 'ideas',
      timestamp: '5 hours ago',
      hasAudio: true,
    },
    {
      id: '3',
      title: 'Client Feedback - TechCorp',
      content: 'Very satisfied with implementation. Wants custom reporting features. Considering enterprise upgrade.',
      category: 'clients',
      timestamp: 'Yesterday',
      hasAudio: false,
    },
    {
      id: '4',
      title: 'Investment Opportunity Notes',
      content: 'Series B startup in AI space. Strong team, 40% YoY growth. Due diligence needed on tech stack.',
      category: 'investments',
      timestamp: 'Yesterday',
      hasAudio: true,
    },
    {
      id: '5',
      title: 'Team Performance Observations',
      content: 'Sarah excelling in client presentations. Michael needs support with project management.',
      category: 'team',
      timestamp: '2 days ago',
      hasAudio: false,
    },
  ];

  const categories = [
    { key: 'general', label: 'General', icon: 'document-text', color: '#FFFFFF' },
    { key: 'meetings', label: 'Meetings', icon: 'people', color: '#8B5CF6' },
    { key: 'ideas', label: 'Ideas', icon: 'bulb', color: '#F59E0B' },
    { key: 'clients', label: 'Clients', icon: 'briefcase', color: '#10B981' },
    { key: 'investments', label: 'Investments', icon: 'trending-up', color: '#EF4444' },
    { key: 'team', label: 'Team', icon: 'people-circle', color: '#6366F1' },
  ];

  const quickActions = [
    { icon: 'mic', label: 'Voice', action: toggleRecording },
    { icon: 'camera', label: 'Photo', action: () => Alert.alert('Camera', 'Opening camera...') },
    { icon: 'scan', label: 'Scan', action: () => Alert.alert('Scanner', 'Opening document scanner...') },
    { icon: 'link', label: 'Link', action: () => Alert.alert('Add Link', 'Paste a URL to save') },
  ];

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.key === category);
    return cat?.color || theme.textSecondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Quick Capture</Text>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveNote}>
            <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'capture' && { borderBottomColor: '#FFFFFF', borderBottomWidth: 2 }
            ]}
            onPress={() => setSelectedTab('capture')}
          >
            <Text style={[
              styles.tabText,
              { color: selectedTab === 'capture' ? '#FFFFFF' : theme.textSecondary }
            ]}>
              Capture
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'notes' && { borderBottomColor: '#FFFFFF', borderBottomWidth: 2 }
            ]}
            onPress={() => setSelectedTab('notes')}
          >
            <Text style={[
              styles.tabText,
              { color: selectedTab === 'notes' ? '#FFFFFF' : theme.textSecondary }
            ]}>
              Recent Notes
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'capture' ? (
          <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.quickAction, { backgroundColor: theme.surface }]}
                  onPress={action.action}
                >
                  <View style={[
                    styles.quickActionIcon,
                    action.label === 'Voice' && isRecording && { backgroundColor: '#EF4444' }
                  ]}>
                    <Ionicons
                      name={action.icon as any}
                      size={24}
                      color={action.label === 'Voice' && isRecording ? 'white' : '#FFFFFF'}
                    />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: theme.textSecondary }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Note Input */}
            <View style={[styles.noteInputContainer, { backgroundColor: theme.surface }]}>
              <TextInput
                style={[styles.titleInput, { color: theme.text }]}
                placeholder="Note title..."
                placeholderTextColor={theme.textSecondary}
                value={noteTitle}
                onChangeText={setNoteTitle}
                onSubmitEditing={() => contentInputRef.current?.focus()}
              />

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <TextInput
                ref={contentInputRef}
                style={[styles.contentInput, { color: theme.text }]}
                placeholder="Start typing or use voice to capture your thoughts..."
                placeholderTextColor={theme.textSecondary}
                value={noteContent}
                onChangeText={setNoteContent}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />

              {/* Category Selection */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryChip,
                      { borderColor: category.color },
                      selectedCategory === category.key && { backgroundColor: category.color }
                    ]}
                    onPress={() => setSelectedCategory(category.key)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={16}
                      color={selectedCategory === category.key ? 'white' : category.color}
                    />
                    <Text style={[
                      styles.categoryLabel,
                      { color: selectedCategory === category.key ? 'white' : category.color }
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* AI Suggestions */}
            <View style={[styles.aiSuggestionsCard, { backgroundColor: theme.surface }]}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                <Text style={[styles.aiTitle, { color: theme.text }]}>
                  {user?.assistantName || 'Yo!'} Suggestions
                </Text>
              </View>

              <TouchableOpacity style={styles.suggestionItem}>
                <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>
                  "Convert this to a task with deadline"
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.suggestionItem}>
                <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>
                  "Extract action items from meeting notes"
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.suggestionItem}>
                <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>
                  "Create follow-up reminders"
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
            {/* Recent Notes List */}
            <View style={styles.notesList}>
              {recentNotes.map((note, index) => (
                <TouchableOpacity
                  key={note.id}
                  style={[styles.noteCard, { backgroundColor: theme.surface }]}
                >
                  <View style={styles.noteHeader}>
                    <View style={[styles.categoryIndicator, { backgroundColor: getCategoryColor(note.category) }]} />
                    <View style={styles.noteContent}>
                      <Text style={[styles.noteTitle, { color: theme.text }]}>
                        {note.title}
                      </Text>
                      <Text
                        style={[styles.notePreview, { color: theme.textSecondary }]}
                        numberOfLines={2}
                      >
                        {note.content}
                      </Text>
                      <View style={styles.noteMeta}>
                        <Text style={[styles.noteTimestamp, { color: theme.textSecondary }]}>
                          {note.timestamp}
                        </Text>
                        {note.hasAudio && (
                          <View style={styles.audioIndicator}>
                            <Ionicons name="mic" size={14} color="#FFFFFF" />
                            <Text style={[styles.audioText, { color: '#FFFFFF' }]}>
                              Audio
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity style={styles.noteActions}>
                      <Ionicons name="ellipsis-vertical" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search Notes */}
            <TouchableOpacity
              style={[styles.searchNotesButton, { backgroundColor: '#FFFFFF' }]}
            >
              <Ionicons name="search" size={20} color="white" />
              <Text style={styles.searchNotesText}>Search All Notes</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Floating Voice Button */}
      {selectedTab === 'capture' && (
        <TouchableOpacity
          style={[
            styles.floatingVoiceButton,
            isRecording && styles.recordingButton
          ]}
          onPress={toggleRecording}
        >
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={28}
            color="white"
          />
        </TouchableOpacity>
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
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  quickActionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(21, 183, 232, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  noteInputContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
  },
  categoriesContainer: {
    marginTop: 16,
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  aiSuggestionsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
  },
  notesList: {
    padding: 16,
  },
  noteCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
  },
  categoryIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  notePreview: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteTimestamp: {
    fontSize: 12,
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  audioText: {
    fontSize: 12,
    marginLeft: 4,
  },
  noteActions: {
    padding: 4,
  },
  searchNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  searchNotesText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  floatingVoiceButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordingButton: {
    backgroundColor: '#EF4444',
  },
});

export default QuickCaptureScreen;
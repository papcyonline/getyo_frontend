import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';
import { addNote } from '../store/slices/noteSlice';

const QuickNoteScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const textInputRef = useRef<TextInput>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'personal' | 'work' | 'idea' | 'urgent'>('personal');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    // Auto-focus the text input when screen loads
    const timer = setTimeout(() => {
      textInputRef.current?.focus();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Update word and character counts
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    setWordCount(words);
    setCharCount(content.length);
  }, [content]);

  const handleBack = () => {
    if (content.trim() || title.trim()) {
      Alert.alert(
        'Discard Note?',
        'You have unsaved changes. Are you sure you want to discard this note?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your note');
      return;
    }

    const newNote = {
      id: Date.now().toString(),
      userId: 'current-user', // TODO: Get from user context/auth
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      category,
      wordCount,
      charCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch(addNote(newNote));
    Alert.alert('Success', 'Note saved successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'personal': return '#10B981';
      case 'work': return '#FFFFFF';
      case 'idea': return '#F59E0B';
      case 'urgent': return '#FF4757';
      default: return '#FFFFFF';
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'personal': return 'person-outline';
      case 'work': return 'briefcase-outline';
      case 'idea': return 'bulb-outline';
      case 'urgent': return 'warning-outline';
      default: return 'document-text-outline';
    }
  };

  const generateAutoTitle = () => {
    if (content.trim()) {
      // Generate title from first line or first few words
      const firstLine = content.split('\n')[0];
      const autoTitle = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
      setTitle(autoTitle);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Quick Note</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
            <View style={styles.categoryContainer}>
              {[
                { key: 'personal', label: 'Personal' },
                { key: 'work', label: 'Work' },
                { key: 'idea', label: 'Idea' },
                { key: 'urgent', label: 'Urgent' }
              ].map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: category === key ? getCategoryColor(key) : theme.surface,
                      borderColor: category === key ? getCategoryColor(key) : theme.border
                    }
                  ]}
                  onPress={() => setCategory(key as any)}
                >
                  <Ionicons
                    name={getCategoryIcon(key) as any}
                    size={16}
                    color={category === key ? '#FFFFFF' : theme.text}
                  />
                  <Text style={[
                    styles.categoryText,
                    { color: category === key ? '#FFFFFF' : theme.text }
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <View style={styles.titleHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Title (Optional)</Text>
            <TouchableOpacity
              style={styles.autoTitleButton}
              onPress={generateAutoTitle}
              disabled={!content.trim()}
            >
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={content.trim() ? '#F59E0B' : theme.textSecondary}
              />
              <Text style={[
                styles.autoTitleText,
                { color: content.trim() ? '#F59E0B' : theme.textSecondary }
              ]}>
                Auto
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.titleInput, {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Enter a title for your note"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Content Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Content</Text>
          <TextInput
            ref={textInputRef}
            style={[styles.contentInput, {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Start typing your note here..."
            placeholderTextColor={theme.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
            maxLength={5000}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{wordCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Words</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{charCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Characters</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Text style={[styles.statNumber, { color: getCategoryColor(category) }]}>
              {category.toUpperCase()}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Category</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => {
                const timestamp = new Date().toLocaleString();
                setContent(prev => prev + (prev ? '\n\n' : '') + `[${timestamp}] `);
              }}
            >
              <Ionicons name="time-outline" size={20} color={theme.text} />
              <Text style={[styles.actionText, { color: theme.text }]}>Add Timestamp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => {
                setContent(prev => prev + (prev ? '\n\n' : '') + '• ');
              }}
            >
              <Ionicons name="list-outline" size={20} color={theme.text} />
              <Text style={[styles.actionText, { color: theme.text }]}>Add Bullet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preview */}
        {(title.trim() || content.trim()) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Preview</Text>
            <View style={[styles.previewCard, {
              backgroundColor: theme.surface,
              borderColor: getCategoryColor(category)
            }]}>
              <View style={styles.previewHeader}>
                <Ionicons
                  name={getCategoryIcon(category) as any}
                  size={20}
                  color={getCategoryColor(category)}
                />
                <Text style={[styles.previewTitle, { color: theme.text }]}>
                  {title || 'Untitled Note'}
                </Text>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(category) }]}>
                  <Text style={styles.categoryBadgeText}>
                    {category.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.previewContent, { color: theme.textSecondary }]}>
                {content.substring(0, 150)}{content.length > 150 ? '...' : ''}
              </Text>
              <Text style={[styles.previewMeta, { color: theme.textSecondary }]}>
                {wordCount} words • {charCount} characters • {new Date().toLocaleDateString()}
              </Text>
            </View>
          </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  categoryText: {
    fontWeight: '500',
    fontSize: 14,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  autoTitleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    minHeight: 200,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionText: {
    fontWeight: '500',
  },
  previewCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
  },
  previewContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  previewMeta: {
    fontSize: 12,
  },
});

export default QuickNoteScreen;
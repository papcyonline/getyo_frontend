import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

/**
 * EmptyState Component
 *
 * Beautiful empty state for lists and data views
 * Guides users on what to do when there's no content
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'cube-outline',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(59, 130, 246, 0.1)', 'rgba(37, 99, 235, 0.05)']}
        style={styles.iconContainer}
      >
        <Ionicons name={icon} size={48} color="#3B82F6" />
      </LinearGradient>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
        >
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.actionButtonGradient}
          >
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {secondaryActionLabel && onSecondaryAction && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onSecondaryAction}
        >
          <Text style={styles.secondaryButtonText}>{secondaryActionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Preset Empty States
 */
export const EmptyTasksState: React.FC<{ onCreateTask: () => void }> = ({ onCreateTask }) => (
  <EmptyState
    icon="checkmark-circle-outline"
    title="No Tasks Yet"
    description="Start organizing your work by creating your first task. Your AI assistant will help you stay on track."
    actionLabel="Create Task"
    onAction={onCreateTask}
  />
);

export const EmptyEventsState: React.FC<{ onCreateEvent: () => void }> = ({ onCreateEvent }) => (
  <EmptyState
    icon="calendar-outline"
    title="No Events Scheduled"
    description="Add events to your calendar and let your AI assistant help you manage your schedule."
    actionLabel="Add Event"
    onAction={onCreateEvent}
  />
);

export const EmptyConversationsState: React.FC<{ onStartConversation: () => void }> = ({ onStartConversation }) => (
  <EmptyState
    icon="chatbubble-outline"
    title="No Conversations"
    description="Start a conversation with your AI assistant. Ask questions, get insights, or just chat!"
    actionLabel="Start Conversation"
    onAction={onStartConversation}
  />
);

export const EmptyNotesState: React.FC<{ onCreateNote: () => void }> = ({ onCreateNote }) => (
  <EmptyState
    icon="document-text-outline"
    title="No Notes"
    description="Capture your thoughts and ideas. Your AI assistant can help organize and find them later."
    actionLabel="Create Note"
    onAction={onCreateNote}
  />
);

export const EmptyRemindersState: React.FC<{ onCreateReminder: () => void }> = ({ onCreateReminder }) => (
  <EmptyState
    icon="notifications-outline"
    title="No Reminders"
    description="Never forget important tasks. Set up reminders and get notified at the right time."
    actionLabel="Add Reminder"
    onAction={onCreateReminder}
  />
);

export const EmptySearchState: React.FC = () => (
  <EmptyState
    icon="search-outline"
    title="No Results Found"
    description="We couldn't find anything matching your search. Try different keywords or filters."
  />
);

export const OfflineState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <EmptyState
    icon="cloud-offline-outline"
    title="You're Offline"
    description="Check your internet connection and try again. Your data is saved and will sync when you're back online."
    actionLabel="Retry"
    onAction={onRetry}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  actionButton: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default EmptyState;

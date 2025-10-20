/**
 * Status Constants
 *
 * Central source of truth for all status values used across the application.
 * This prevents enum mismatches and ensures data consistency.
 */

// Task Status Constants
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];

// Assignment Status Constants
// Note: Must match backend format (underscore for IN_PROGRESS)
export const AssignmentStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',  // Backend uses underscore
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type AssignmentStatusType = typeof AssignmentStatus[keyof typeof AssignmentStatus];

// Recording Status Constants
export const RecordingStatus = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PAUSED: 'paused',
  PROCESSING: 'processing',
  RECORDED: 'recorded',
  PLAYING: 'playing',
} as const;

export type RecordingStatusType = typeof RecordingStatus[keyof typeof RecordingStatus];

// Notification Type Constants
export const NotificationType = {
  TASK_REMINDER: 'task_reminder',
  AI_SUGGESTION: 'ai_suggestion',
  ASSIGNMENT_COMPLETE: 'assignment_complete',
  ASSIGNMENT_FAILED: 'assignment_failed',
  PATTERN_DETECTED: 'pattern_detected',
  SYSTEM: 'system',
} as const;

export type NotificationTypeType = typeof NotificationType[keyof typeof NotificationType];

// Conversation Status Constants
export const ConversationStatus = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

export type ConversationStatusType = typeof ConversationStatus[keyof typeof ConversationStatus];

// Export all status values as arrays for validation
export const VALID_TASK_STATUSES = Object.values(TaskStatus);
export const VALID_ASSIGNMENT_STATUSES = Object.values(AssignmentStatus);
export const VALID_RECORDING_STATUSES = Object.values(RecordingStatus);
export const VALID_NOTIFICATION_TYPES = Object.values(NotificationType);
export const VALID_CONVERSATION_STATUSES = Object.values(ConversationStatus);

// Helper functions for UI display
export const getTaskStatusColor = (status: TaskStatusType): string => {
  switch (status) {
    case TaskStatus.PENDING:
      return '#FFA500'; // Orange
    case TaskStatus.IN_PROGRESS:
      return '#4A90E2'; // Blue
    case TaskStatus.COMPLETED:
      return '#4CAF50'; // Green
    case TaskStatus.CANCELLED:
      return '#757575'; // Gray
    default:
      return '#757575';
  }
};

export const getTaskStatusLabel = (status: TaskStatusType): string => {
  switch (status) {
    case TaskStatus.PENDING:
      return 'Pending';
    case TaskStatus.IN_PROGRESS:
      return 'In Progress';
    case TaskStatus.COMPLETED:
      return 'Completed';
    case TaskStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

export const getAssignmentStatusLabel = (status: AssignmentStatusType): string => {
  switch (status) {
    case AssignmentStatus.PENDING:
      return 'Pending';
    case AssignmentStatus.IN_PROGRESS:
      return 'In Progress';
    case AssignmentStatus.COMPLETED:
      return 'Completed';
    case AssignmentStatus.FAILED:
      return 'Failed';
    default:
      return 'Unknown';
  }
};
